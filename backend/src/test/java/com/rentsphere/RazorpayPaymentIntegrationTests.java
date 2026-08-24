package com.rentsphere;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentsphere.entity.Payment;
import com.rentsphere.entity.PaymentStatus;
import com.rentsphere.repository.PaymentRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class RazorpayPaymentIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PaymentRepository paymentRepository;

    @Value("${app.razorpay.key-secret}")
    private String keySecret;

    @Value("${app.razorpay.webhook-secret}")
    private String webhookSecret;

    @Test
    void verifyAcceptsValidSignatureAndMarksPaymentSuccess() throws Exception {
        Setup setup = setupTenantInvoice();

        String orderId = "order_test_" + UUID.randomUUID();
        String paymentId = "pay_test_" + UUID.randomUUID();
        String signature = hmac(orderId + "|" + paymentId, keySecret);

        mockMvc.perform(post("/payments/razorpay/verify")
                        .header(HttpHeaders.AUTHORIZATION, bearer(setup.tenantToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(verifyBody(setup.invoiceId(), orderId, paymentId, signature)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.invoiceId").value(setup.invoiceId()))
                .andExpect(jsonPath("$.amount").value(18500.0));

        mockMvc.perform(get("/invoices/{id}", setup.invoiceId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(setup.adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));
    }

    @Test
    void verifyRejectsTamperedSignature() throws Exception {
        Setup setup = setupTenantInvoice();

        String orderId = "order_test_" + UUID.randomUUID();
        String paymentId = "pay_test_" + UUID.randomUUID();
        String tampered = hmac(orderId + "|" + paymentId, keySecret).substring(0, 20) + "deadbeefdeadbeef";

        mockMvc.perform(post("/payments/razorpay/verify")
                        .header(HttpHeaders.AUTHORIZATION, bearer(setup.tenantToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(verifyBody(setup.invoiceId(), orderId, paymentId, tampered)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/invoices/{id}", setup.invoiceId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(setup.adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void tenantCannotPayAnotherTenantsInvoice() throws Exception {
        Setup setup = setupTenantInvoice();

        String otherTenantEmail = "other-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        JsonNode otherUser = postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Other Tenant",
                  "email": "%s",
                  "password": "Password123!",
                  "role": "TENANT",
                  "phone": "5550777"
                }
                """.formatted(setup.organizationId(), otherTenantEmail), setup.adminToken(), 201);
        String otherUserId = id(otherUser);
        String otherTenantToken = login(otherTenantEmail);

        postJson("/tenants", """
                {
                  "organizationId": "%s",
                  "userId": "%s",
                  "fullName": "Other Tenant",
                  "phone": "5550777"
                }
                """.formatted(setup.organizationId(), otherUserId), setup.adminToken(), 201);

        String orderId = "order_test_" + UUID.randomUUID();
        String paymentId = "pay_test_" + UUID.randomUUID();
        String signature = hmac(orderId + "|" + paymentId, keySecret);

        mockMvc.perform(post("/payments/razorpay/verify")
                        .header(HttpHeaders.AUTHORIZATION, bearer(otherTenantToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(verifyBody(setup.invoiceId(), orderId, paymentId, signature)))
                .andExpect(status().isForbidden());
    }

    @Test
    void tenantCanListOnlyOwnInvoices() throws Exception {
        Setup setup = setupTenantInvoice();

        mockMvc.perform(get("/invoices/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(setup.tenantToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(setup.invoiceId()));

        mockMvc.perform(get("/invoices")
                        .header(HttpHeaders.AUTHORIZATION, bearer(setup.tenantToken())))
                .andExpect(status().isForbidden());
    }

    @Test
    void tenantCanListOwnRazorpayPayments() throws Exception {
        Setup setup = setupTenantInvoice();
        String orderId = "order_history_" + UUID.randomUUID();
        Payment pending = Payment.builder()
                .organizationId(UUID.fromString(setup.organizationId()))
                .invoiceId(UUID.fromString(setup.invoiceId()))
                .amount(new java.math.BigDecimal("18500.00"))
                .status(PaymentStatus.PENDING)
                .razorpayOrderId(orderId)
                .build();
        paymentRepository.save(pending);

        mockMvc.perform(get("/payments/me")
                        .header(HttpHeaders.AUTHORIZATION, bearer(setup.tenantToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].invoiceId").value(setup.invoiceId()))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void webhookCapturedEventMarksPaymentSuccess() throws Exception {
        Setup setup = setupTenantInvoice();

        String orderId = "order_webhook_" + UUID.randomUUID();
        String paymentId = "pay_webhook_" + UUID.randomUUID();

        Payment pending = Payment.builder()
                .organizationId(UUID.fromString(setup.organizationId()))
                .invoiceId(UUID.fromString(setup.invoiceId()))
                .amount(new java.math.BigDecimal("18500.00"))
                .status(PaymentStatus.PENDING)
                .razorpayOrderId(orderId)
                .build();
        paymentRepository.save(pending);

        String body = webhookBody("payment.captured", orderId, paymentId);
        String signature = hmac(body, webhookSecret);

        mockMvc.perform(post("/payments/razorpay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("X-Razorpay-Signature", signature))
                .andExpect(status().isOk());

        Payment saved = paymentRepository.findFirstByRazorpayOrderIdOrderByCreatedAtDesc(orderId).orElseThrow();
        assertEquals(PaymentStatus.SUCCESS, saved.getStatus());
        assertEquals(paymentId, saved.getRazorpayPaymentId());

        mockMvc.perform(get("/invoices/{id}", setup.invoiceId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(setup.adminToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));
    }

    @Test
    void webhookRejectsInvalidSignature() throws Exception {
        String body = webhookBody("payment.captured", "order_webhook_x", "pay_webhook_x");

        mockMvc.perform(post("/payments/razorpay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("X-Razorpay-Signature", "invalid-signature"))
                .andExpect(status().isBadRequest());
    }

    private Setup setupTenantInvoice() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "rzp-admin-" + suffix + "@example.com";
        String tenantEmail = "rzp-tenant-" + suffix + "@example.com";

        register(adminEmail, "ADMIN", null);
        String adminToken = login(adminEmail);

        JsonNode organization = postJson("/organizations", """
                {
                  "name": "Razorpay Test Rentals",
                  "address": "1 Payment Plaza",
                  "phone": "5550100",
                  "email": "rzp-ops-%s@example.com"
                }
                """.formatted(suffix), adminToken, 201);
        String organizationId = id(organization);

        JsonNode tenantUser = postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Razorpay Tenant",
                  "email": "%s",
                  "password": "Password123!",
                  "role": "TENANT",
                  "phone": "5550122"
                }
                """.formatted(organizationId, tenantEmail), adminToken, 201);
        String tenantUserId = id(tenantUser);
        String tenantToken = login(tenantEmail);

        JsonNode tenant = postJson("/tenants", """
                {
                  "organizationId": "%s",
                  "userId": "%s",
                  "fullName": "Razorpay Tenant",
                  "phone": "5550122"
                }
                """.formatted(organizationId, tenantUserId), adminToken, 201);
        String tenantId = id(tenant);

        JsonNode invoice = postJson("/invoices", """
                {
                  "organizationId": "%s",
                  "tenantId": "%s",
                  "amount": 18500.00,
                  "dueDate": "2027-03-05",
                  "status": "PENDING"
                }
                """.formatted(organizationId, tenantId), adminToken, 201);
        String invoiceId = id(invoice);

        return new Setup(organizationId, tenantId, invoiceId, tenantToken, adminToken);
    }

    private String verifyBody(String invoiceId, String orderId, String paymentId, String signature) {
        return """
                {
                  "razorpayOrderId": "%s",
                  "razorpayPaymentId": "%s",
                  "razorpaySignature": "%s",
                  "invoiceId": "%s"
                }
                """.formatted(orderId, paymentId, signature, invoiceId);
    }

    private String webhookBody(String event, String orderId, String paymentId) {
        return """
                {
                  "event": "%s",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "%s",
                        "order_id": "%s",
                        "amount": 1850000,
                        "currency": "INR",
                        "status": "captured"
                      }
                    }
                  }
                }
                """.formatted(event, paymentId, orderId);
    }

    private String hmac(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] raw = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder(raw.length * 2);
        for (byte b : raw) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    private void register(String email, String role, String organizationId) throws Exception {
        String organizationLine = organizationId == null ? "" : "\"organizationId\": \"%s\",".formatted(organizationId);
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s User",
                                  "email": "%s",
                                  "password": "Password123!",
                                  %s
                                  "phone": "5550000",
                                  "role": "%s"
                                }
                                """.formatted(role, email, organizationLine, role)))
                .andExpect(status().isCreated());
    }

    private String login(String email) throws Exception {
        JsonNode response = postJson("/auth/login", """
                {
                  "email": "%s",
                  "password": "Password123!"
                }
                """.formatted(email), null, 200);
        return response.at("/token").asText();
    }

    private JsonNode postJson(String path, String body, String token, int expectedStatus) throws Exception {
        var request = post(path).contentType(MediaType.APPLICATION_JSON).content(body);
        if (token != null) {
            request.header(HttpHeaders.AUTHORIZATION, bearer(token));
        }
        MvcResult result = mockMvc.perform(request)
                .andExpect(status().is(expectedStatus))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private String id(JsonNode node) {
        return node.at("/id").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record Setup(
            String organizationId,
            String tenantId,
            String invoiceId,
            String tenantToken,
            String adminToken
    ) {
    }
}
