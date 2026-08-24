package com.rentsphere.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

import com.rentsphere.entity.Payment;
import com.rentsphere.entity.PaymentStatus;
import com.rentsphere.repository.PaymentRepository;
import com.rentsphere.repository.InvoiceRepository;
import com.rentsphere.security.SecurityUtils;

@Service
@Slf4j
public class PaymentService extends BaseCrudService<Payment> {

    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final InvoiceRepository invoiceRepository;

    public PaymentService(PaymentRepository paymentRepository, NotificationService notificationService,
            InvoiceRepository invoiceRepository) {
        super(paymentRepository, "Payment");
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<Payment> findAll() {
        return findAllScoped(paymentRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Payment> findAll(Pageable pageable) {
        return findAllScoped(pageable, paymentRepository::findByOrganizationId);
    }

    @Transactional
    @CacheEvict(cacheResolver = "baseCrudCacheResolver", allEntries = true)
    public Payment createRazorpayOrderPayment(UUID organizationId, UUID invoiceId, BigDecimal amount, String razorpayOrderId) {
        Payment payment = Payment.builder()
                .organizationId(organizationId)
                .invoiceId(invoiceId)
                .amount(amount)
                .status(PaymentStatus.PENDING)
                .razorpayOrderId(razorpayOrderId)
                .build();
        Payment saved = paymentRepository.save(payment);
        return saved;
    }

    @Transactional
    @CacheEvict(cacheResolver = "baseCrudCacheResolver", allEntries = true)
    public Payment recordSuccessfulPayment(String razorpayOrderId, UUID invoiceId, BigDecimal amount, UUID organizationId, String razorpayPaymentId) {
        Payment payment = paymentRepository.findFirstByRazorpayOrderIdOrderByCreatedAtDesc(razorpayOrderId)
                .orElseGet(() -> Payment.builder()
                        .organizationId(organizationId)
                        .invoiceId(invoiceId)
                        .amount(amount)
                        .razorpayOrderId(razorpayOrderId)
                        .build());
        boolean alreadySuccessful = payment.getStatus() == PaymentStatus.SUCCESS;
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaymentDate(LocalDateTime.now());
        payment.setRazorpayPaymentId(razorpayPaymentId);
        Payment saved = paymentRepository.save(payment);
        if (!alreadySuccessful) notifyPaymentResult(saved, true);
        return saved;
    }

    @Transactional
    @CacheEvict(cacheResolver = "baseCrudCacheResolver", allEntries = true)
    public Optional<Payment> markRazorpayFailed(String razorpayOrderId) {
        return paymentRepository.findFirstByRazorpayOrderIdOrderByCreatedAtDesc(razorpayOrderId)
                .map(payment -> {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setPaymentDate(LocalDateTime.now());
                    Payment saved = paymentRepository.save(payment);
                    notifyPaymentResult(saved, false);
                    return saved;
                });
    }

    /** Notification delivery is secondary and must not roll back a verified payment. */
    private void notifyPaymentResult(Payment payment, boolean successful) {
        try {
            notificationService.notifyOrganizationStaff(
                    payment.getOrganizationId(),
                    successful ? "Rent payment received" : "Payment failed",
                    "Payment of " + payment.getAmount() + (successful
                            ? " was completed successfully."
                            : " could not be completed."),
                    successful ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
                    "/payments");
            if (payment.getInvoiceId() != null) {
                invoiceRepository.findById(payment.getInvoiceId()).ifPresent(invoice ->
                        notificationService.notifyTenant(invoice.getTenantId(),
                                successful ? "Payment confirmed" : "Payment failed",
                                successful
                                        ? "Your rent payment of " + payment.getAmount() + " was confirmed. Your invoice is ready to download."
                                        : "Your payment of " + payment.getAmount() + " failed. Open Payments to try again.",
                                successful ? "PAYMENT_CONFIRMED" : "PAYMENT_ACTION_REQUIRED",
                                "/payments"));
            }
        } catch (RuntimeException exception) {
            log.warn("Payment {} was saved but its notification could not be delivered", payment.getId(), exception);
        }
    }

    @Transactional(readOnly = true)
    public List<Payment> findByInvoiceIds(List<UUID> invoiceIds) {
        if (invoiceIds.isEmpty()) {
            return List.of();
        }
        return withoutSupersededPendingPayments(paymentRepository.findByInvoiceIdIn(invoiceIds));
    }

    @Transactional(readOnly = true)
    public List<Payment> findPaymentHistory() {
        if (SecurityUtils.isAdmin()) {
            return withoutSupersededPendingPayments(paymentRepository.findAll());
        }
        UUID organizationId = SecurityUtils.getCurrentOrganizationId();
        if (organizationId == null) {
            return List.of();
        }
        return withoutSupersededPendingPayments(paymentRepository.findByOrganizationId(organizationId));
    }

    private List<Payment> withoutSupersededPendingPayments(List<Payment> payments) {
        Set<UUID> paidInvoiceIds = payments.stream()
                .filter(payment -> payment.getStatus() == PaymentStatus.SUCCESS)
                .map(Payment::getInvoiceId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        return payments.stream()
                .filter(payment -> payment.getStatus() != PaymentStatus.PENDING
                        || !paidInvoiceIds.contains(payment.getInvoiceId()))
                .toList();
    }

    @Override
    protected void applyUpdates(Payment entity, Payment request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setInvoiceId(request.getInvoiceId());
        entity.setAmount(request.getAmount());
        entity.setStatus(request.getStatus());
        entity.setPaymentDate(request.getPaymentDate());
    }
}
