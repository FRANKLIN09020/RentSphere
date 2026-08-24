package com.rentsphere.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.rentsphere.config.RazorpayProperties;
import com.rentsphere.dto.RazorpayCreateOrderResponse;
import com.rentsphere.entity.Invoice;
import com.rentsphere.entity.Payment;
import com.rentsphere.entity.PaymentStatus;
import com.rentsphere.entity.Tenant;
import com.rentsphere.entity.User;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.repository.InvoiceRepository;
import com.rentsphere.repository.PaymentRepository;
import com.rentsphere.repository.UserRepository;
import com.rentsphere.security.SecurityUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RazorpayService {

    private static final String CURRENCY_INR = "INR";
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final RazorpayClient razorpayClient;
    private final RazorpayProperties properties;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final TenantService tenantService;
    private final PaymentService paymentService;
    private final InvoiceService invoiceService;
    private final ObjectMapper objectMapper;

    public RazorpayCreateOrderResponse createOrder(UUID invoiceId, BigDecimal amount) {
        Invoice invoice = findAccessibleInvoice(invoiceId);
        if (amount == null || invoice.getAmount().compareTo(amount) != 0) {
            throw new IllegalArgumentException("Amount does not match the invoice amount");
        }
        if (paymentRepository.existsByInvoiceIdAndStatus(invoiceId, PaymentStatus.SUCCESS)) {
            throw new IllegalArgumentException("Invoice is already paid");
        }
        ensureKeysConfigured();
        Payment existingPending = paymentRepository
                .findFirstByInvoiceIdAndStatusOrderByCreatedAtDesc(invoiceId, PaymentStatus.PENDING)
                .orElse(null);
        if (existingPending != null && existingPending.getRazorpayOrderId() != null
                && !existingPending.getRazorpayOrderId().isBlank()) {
            RazorpayCreateOrderResponse reconciled = reconcilePaidOrder(existingPending, invoice);
            if (reconciled != null) {
                return reconciled;
            }
            return RazorpayCreateOrderResponse.builder()
                    .orderId(existingPending.getRazorpayOrderId())
                    .amount(invoice.getAmount().movePointRight(2).longValueExact())
                    .currency(CURRENCY_INR)
                    .keyId(properties.getKeyId())
                    .paymentCompleted(false)
                    .build();
        }
        try {
            long amountInPaise = invoice.getAmount().movePointRight(2).longValueExact();
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", CURRENCY_INR);
            orderRequest.put("receipt", "inv_" + invoiceId);
            orderRequest.put("notes", new JSONObject().put("invoiceId", invoiceId.toString()));

            Order order = razorpayClient.orders.create(orderRequest);
            // Order#get is generic. Passing it directly to String.valueOf can make
            // javac select valueOf(char[]), which fails when Razorpay returns a String.
            Object rawOrderId = order.get("id");
            String orderId = rawOrderId == null ? "" : rawOrderId.toString();
            if (orderId.isBlank()) {
                throw new IllegalStateException("Razorpay returned an order without an id");
            }

            paymentService.createRazorpayOrderPayment(invoice.getOrganizationId(), invoiceId, invoice.getAmount(), orderId);

            return RazorpayCreateOrderResponse.builder()
                    .orderId(orderId)
                    .amount(amountInPaise)
                    .currency(CURRENCY_INR)
                    .keyId(properties.getKeyId())
                    .paymentCompleted(false)
                    .build();
        } catch (RazorpayException | JSONException e) {
            throw new IllegalStateException("Failed to create Razorpay order", e);
        }
    }

    @Transactional
    public Payment verifyPayment(UUID invoiceId, String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        Invoice invoice = findAccessibleInvoice(invoiceId);
        if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            throw new IllegalArgumentException("Payment signature verification failed");
        }

        Payment payment = paymentRepository
                .findFirstByRazorpayOrderIdOrderByCreatedAtDesc(razorpayOrderId)
                .orElse(null);
        if (payment != null && !invoiceId.equals(payment.getInvoiceId())) {
            throw new IllegalArgumentException("Razorpay order does not match the invoice");
        }
        if (payment != null && payment.getStatus() == PaymentStatus.SUCCESS) {
            if (invoice.getStatus() != com.rentsphere.entity.InvoiceStatus.PAID) {
                invoiceService.markPaid(invoiceId);
            }
            return payment;
        }
        if (payment == null && paymentRepository.existsByInvoiceIdAndStatus(invoiceId, PaymentStatus.SUCCESS)) {
            throw new IllegalArgumentException("Invoice is already paid");
        }

        Payment saved = paymentService.recordSuccessfulPayment(
                razorpayOrderId, invoiceId, invoice.getAmount(), invoice.getOrganizationId(), razorpayPaymentId);
        invoiceService.markPaid(invoiceId);
        return saved;
    }

    public String handleWebhook(String body, String signature) {
        if (properties.getWebhookSecret() == null || properties.getWebhookSecret().isBlank()) {
            throw new IllegalArgumentException("Razorpay webhook secret is not configured");
        }
        if (!verifyWebhookSignature(body, signature)) {
            throw new IllegalArgumentException("Razorpay webhook signature verification failed");
        }

        try {
            JsonNode root = objectMapper.readTree(body);
            String event = root.path("event").asText("");
            JsonNode entity = root.path("payload").path("payment").path("entity");
            if (entity.isTextual()) {
                entity = objectMapper.readTree(entity.asText());
            }
            String orderId = entity.path("order_id").asText("");
            String paymentId = entity.path("id").asText("");
            if (orderId.isBlank()) {
                return "ignored";
            }

            if ("payment.captured".equals(event)) {
                paymentRepository.findFirstByRazorpayOrderIdOrderByCreatedAtDesc(orderId).ifPresentOrElse(pending -> {
                    if (pending.getStatus() != PaymentStatus.SUCCESS) {
                        pending.setStatus(PaymentStatus.SUCCESS);
                        pending.setPaymentDate(LocalDateTime.now());
                        pending.setRazorpayPaymentId(paymentId);
                        paymentRepository.save(pending);
                        invoiceService.markPaid(pending.getInvoiceId());
                    }
                }, () -> log.warn("Razorpay webhook referenced unknown order {}", orderId));
            } else if ("payment.failed".equals(event)) {
                paymentService.markRazorpayFailed(orderId);
            }
            return "ok";
        } catch (Exception e) {
            throw new IllegalStateException("Failed to process Razorpay webhook", e);
        }
    }

    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
            return false;
        }
        return verifyHmac(razorpayOrderId + "|" + razorpayPaymentId, properties.getKeySecret(), razorpaySignature);
    }

    public boolean verifyWebhookSignature(String body, String signature) {
        return verifyHmac(body, properties.getWebhookSecret(), signature);
    }

    /**
     * Checkout cannot reopen an order that Razorpay already considers paid. If
     * the browser callback previously failed, recover the authoritative gateway
     * result before returning an order to Checkout again.
     */
    private RazorpayCreateOrderResponse reconcilePaidOrder(Payment pending, Invoice invoice) {
        try {
            Order gatewayOrder = razorpayClient.orders.fetch(pending.getRazorpayOrderId());
            Object rawStatus = gatewayOrder.get("status");
            if (rawStatus == null || !"paid".equalsIgnoreCase(rawStatus.toString())) {
                return null;
            }

            java.util.List<com.razorpay.Payment> gatewayPayments =
                    razorpayClient.orders.fetchPayments(pending.getRazorpayOrderId());
            com.razorpay.Payment gatewayPayment = gatewayPayments.stream()
                    .filter(item -> {
                        Object status = item.get("status");
                        return status != null && ("captured".equalsIgnoreCase(status.toString())
                                || "authorized".equalsIgnoreCase(status.toString()));
                    })
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Paid Razorpay order has no successful payment"));
            Object rawPaymentId = gatewayPayment.get("id");
            if (rawPaymentId == null || rawPaymentId.toString().isBlank()) {
                throw new IllegalStateException("Razorpay payment is missing its id");
            }

            paymentService.recordSuccessfulPayment(
                    pending.getRazorpayOrderId(), invoice.getId(), invoice.getAmount(),
                    invoice.getOrganizationId(), rawPaymentId.toString());
            invoiceService.markPaid(invoice.getId());
            return RazorpayCreateOrderResponse.builder()
                    .orderId(pending.getRazorpayOrderId())
                    .amount(invoice.getAmount().movePointRight(2).longValueExact())
                    .currency(CURRENCY_INR)
                    .keyId(properties.getKeyId())
                    .paymentCompleted(true)
                    .build();
        } catch (RazorpayException exception) {
            log.warn("Unable to reconcile Razorpay order {}; Checkout will retry it",
                    pending.getRazorpayOrderId(), exception);
            return null;
        }
    }

    private boolean verifyHmac(String payload, String secret, String expectedSignature) {
        if (payload == null || secret == null || secret.isBlank()
                || expectedSignature == null || expectedSignature.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            byte[] raw = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String computed = toHex(raw);
            return MessageDigest.isEqual(
                    computed.getBytes(StandardCharsets.US_ASCII),
                    expectedSignature.toLowerCase().getBytes(StandardCharsets.US_ASCII));
        } catch (Exception e) {
            return false;
        }
    }

    private String toHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            hex.append(Character.forDigit((b >> 4) & 0xF, 16));
            hex.append(Character.forDigit(b & 0xF, 16));
        }
        return hex.toString();
    }

    private void ensureKeysConfigured() {
        if (properties.getKeyId() == null || properties.getKeyId().isBlank()
                || properties.getKeySecret() == null || properties.getKeySecret().isBlank()) {
            throw new IllegalStateException(
                    "Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
        }
    }

    private Invoice findAccessibleInvoice(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        UUID currentOrganizationId = SecurityUtils.getCurrentOrganizationId();
        if (currentOrganizationId != null && !currentOrganizationId.equals(invoice.getOrganizationId())) {
            throw new AccessDeniedException("Invoice does not belong to your organization");
        }
        if (SecurityUtils.hasRole("TENANT")) {
            UUID tenantId = resolveCurrentTenantId();
            if (!tenantId.equals(invoice.getTenantId())) {
                throw new AccessDeniedException("Invoice does not belong to you");
            }
        }
        return invoice;
    }

    private UUID resolveCurrentTenantId() {
        String username = SecurityUtils.getCurrentUsername();
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
        return tenantService.findOrCreateForUser(user).getId();
    }
}
