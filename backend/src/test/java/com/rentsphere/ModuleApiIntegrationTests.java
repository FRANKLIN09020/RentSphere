package com.rentsphere;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ModuleApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void authenticatedRentalFlowCoversAllModulesWithSampleData() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "admin-" + suffix + "@example.com";
        String ownerEmail = "owner-" + suffix + "@example.com";
        String tenantEmail = "tenant-" + suffix + "@example.com";
        String propertyImage = testImageDataUrl("QUJD");
        String idProofImage = testImageDataUrl("REVG");
        String addressProofImage = testImageDataUrl("R0hJ");
        String disputeEvidenceImage = testImageDataUrl("SktM");

        register(adminEmail, "ADMIN", null);
        String adminToken = login(adminEmail);

        JsonNode organization = postJson("/organizations", """
                {
                  "name": "Codex Test Rentals",
                  "address": "42 Integration Avenue",
                  "phone": "5550100",
                  "email": "ops-%s@example.com"
                }
                """.formatted(suffix), adminToken, 201);
        String organizationId = id(organization);

        mockMvc.perform(get("/organizations/{id}", organizationId).header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Codex Test Rentals"));

        putJson("/organizations/" + organizationId, """
                {
                  "name": "Codex Test Rentals Updated",
                  "address": "42 Integration Avenue",
                  "phone": "5550101",
                  "email": "ops-updated-%s@example.com"
                }
                """.formatted(suffix), adminToken, 200)
                .at("/name").asText().equals("Codex Test Rentals Updated");

        JsonNode ownerUser = postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Olivia Owner",
                  "email": "%s",
                  "password": "Password123!",
                  "role": "OWNER",
                  "phone": "5550111"
                }
                """.formatted(organizationId, ownerEmail), adminToken, 201);
        String ownerUserId = id(ownerUser);
        String ownerToken = login(ownerEmail);

        JsonNode tenantUser = postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Tara Tenant",
                  "email": "%s",
                  "password": "Password123!",
                  "role": "TENANT",
                  "phone": "5550122"
                }
                """.formatted(organizationId, tenantEmail), adminToken, 201);
        String tenantUserId = id(tenantUser);
        String tenantToken = login(tenantEmail);

        putJson("/users/" + ownerUserId, """
                {
                  "organizationId": "%s",
                  "name": "Olivia Owner",
                  "email": "%s",
                  "role": "OWNER",
                  "phone": "5550112"
                }
                """.formatted(organizationId, ownerEmail), adminToken, 200);

        JsonNode property = postJson("/properties", """
                {
                  "organizationId": "%s",
                  "ownerId": "%s",
                  "name": "Sunrise Residency",
                  "address": "7 Market Street",
                  "city": "Pune",
                  "state": "MH",
                  "imageUrl": "%s"
                }
                """.formatted(organizationId, ownerUserId, propertyImage), adminToken, 201);
        String propertyId = id(property);

        JsonNode building = postJson("/buildings", """
                {
                  "organizationId": "%s",
                  "propertyId": "%s",
                  "name": "Tower A",
                  "floors": 8
                }
                """.formatted(organizationId, propertyId), adminToken, 201);
        String buildingId = id(building);

        JsonNode unit = postJson("/units", """
                {
                  "organizationId": "%s",
                  "buildingId": "%s",
                  "unitNumber": "A-204",
                  "rentAmount": 18500.00,
                  "status": "AVAILABLE"
                }
                """.formatted(organizationId, buildingId), adminToken, 201);
        String unitId = id(unit);

        JsonNode tenant = postJson("/tenants", """
                {
                  "organizationId": "%s",
                  "userId": "%s",
                  "unitId": "%s",
                  "fullName": "Tara Tenant",
                  "phone": "5550122",
                  "emergencyContact": "5550999",
                  "kycStatus": "VERIFIED",
                  "idProofUrl": "%s",
                  "addressProofUrl": "%s"
                }
                """.formatted(organizationId, tenantUserId, unitId, idProofImage, addressProofImage), adminToken, 201);
        String tenantId = id(tenant);

        JsonNode agreement = postJson("/agreements", """
                {
                  "organizationId": "%s",
                  "tenantId": "%s",
                  "unitId": "%s",
                  "startDate": "2027-01-01",
                  "endDate": "2027-12-31",
                  "rentAmount": 18500.00,
                  "status": "ACTIVE"
                }
                """.formatted(organizationId, tenantId, unitId), adminToken, 201);
        String agreementId = id(agreement);

        JsonNode invoice = postJson("/invoices", """
                {
                  "organizationId": "%s",
                  "tenantId": "%s",
                  "agreementId": "%s",
                  "amount": 18500.00,
                  "dueDate": "2027-02-05",
                  "status": "PENDING"
                }
                """.formatted(organizationId, tenantId, agreementId), adminToken, 201);
        String invoiceId = id(invoice);

        JsonNode payment = postJson("/payments", """
                {
                  "organizationId": "%s",
                  "invoiceId": "%s",
                  "amount": 18500.00,
                  "status": "SUCCESS",
                  "paymentDate": "2027-02-03T10:30:00"
                }
                """.formatted(organizationId, invoiceId), adminToken, 201);
        String paymentId = id(payment);

        mockMvc.perform(delete("/payments/{id}", paymentId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/payments")
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "organizationId": "%s",
                                  "invoiceId": "%s",
                                  "amount": 18500.00,
                                  "status": "SUCCESS"
                                }
                                """.formatted(organizationId, invoiceId)))
                .andExpect(status().isForbidden());

        JsonNode complaint = postJson("/complaints", """
                {
                  "organizationId": "%s",
                  "tenantId": "%s",
                  "unitId": "%s",
                  "title": "Water pressure issue",
                  "description": "Kitchen tap pressure is low",
                  "status": "OPEN"
                }
                """.formatted(organizationId, tenantId, unitId), adminToken, 201);
        String complaintId = id(complaint);

        putJson("/complaints/" + complaintId, """
                {
                  "organizationId": "%s",
                  "tenantId": "%s",
                  "unitId": "%s",
                  "title": "Water pressure issue",
                  "description": "Kitchen tap pressure is low",
                  "status": "IN_PROGRESS"
                }
                """.formatted(organizationId, tenantId, unitId), adminToken, 200);

        String depositDisputePayload = """
                {
                  "organizationId": "%s",
                  "tenantId": "%s",
                  "unitId": "%s",
                  "agreementId": "%s",
                  "depositAmount": 50000.00,
                  "deductedAmount": 12000.00,
                  "ownerRepairEstimate": 12000.00,
                  "marketRepairEstimate": 6500.00,
                  "proposedSettlementAmount": 7000.00,
                  "deductionReason": "Wall repainting and deep cleaning",
                  "evidenceUrl": "%s",
                  "tenantNotes": "Photos show normal wear and tear",
                  "ownerResponse": "Owner uploaded repair quote",
                  "settlementDueDate": "2027-01-20",
                  "status": "UNDER_REVIEW"
                }
                """.formatted(organizationId, tenantId, unitId, agreementId, disputeEvidenceImage);
        mockMvc.perform(post("/deposit-disputes")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tenantToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(depositDisputePayload))
                .andExpect(status().isForbidden());
        JsonNode depositDispute = postJson("/deposit-disputes", depositDisputePayload, adminToken, 201);
        String depositDisputeId = id(depositDispute);

        mockMvc.perform(get("/deposit-disputes/{id}/settlement-advice", depositDisputeId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recommendedDeduction").exists())
                .andExpect(jsonPath("$.suggestedRefund").exists())
                .andExpect(jsonPath("$.rationale").isNotEmpty());

        mockMvc.perform(get("/deposit-disputes/{id}/settlement-advice", depositDisputeId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/deposit-disputes/{id}/settlement-advice", depositDisputeId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tenantToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.suggestedRefund").exists());

        putJson("/deposit-disputes/" + depositDisputeId, """
                {
                  "organizationId": "%s",
                  "tenantId": "%s",
                  "unitId": "%s",
                  "agreementId": "%s",
                  "depositAmount": 50000.00,
                  "deductedAmount": 12000.00,
                  "ownerRepairEstimate": 12000.00,
                  "marketRepairEstimate": 6500.00,
                  "proposedSettlementAmount": 7000.00,
                  "deductionReason": "Wall repainting and deep cleaning",
                  "evidenceUrl": "%s",
                  "tenantNotes": "Photos show normal wear and tear",
                  "ownerResponse": "Owner agreed to partial refund",
                  "settlementDueDate": "2027-01-20",
                  "status": "SETTLEMENT_PROPOSED"
                }
                """.formatted(organizationId, tenantId, unitId, agreementId, disputeEvidenceImage), ownerToken, 200);

        JsonNode rentIncrease = postJson("/rent-increases", """
                {
                  "organizationId": "%s",
                  "tenantId": "%s",
                  "unitId": "%s",
                  "agreementId": "%s",
                  "previousRent": 18500.00,
                  "proposedRent": 21000.00,
                  "noticeDate": "2027-02-01",
                  "effectiveDate": "2027-04-01",
                  "notificationScheduledAt": "2027-02-01T09:00:00",
                  "reason": "Annual rent revision",
                  "tenantResponse": "Tenant requested review before accepting",
                  "ownerNotes": "Notification scheduled 60 days before effective date",
                  "status": "NOTICE_SCHEDULED"
                }
                """.formatted(organizationId, tenantId, unitId, agreementId), ownerToken, 201);
        String rentIncreaseId = id(rentIncrease);

        putJson("/rent-increases/" + rentIncreaseId, """
                {
                  "organizationId": "%s",
                  "tenantId": "%s",
                  "unitId": "%s",
                  "agreementId": "%s",
                  "previousRent": 18500.00,
                  "proposedRent": 21000.00,
                  "noticeDate": "2027-02-01",
                  "effectiveDate": "2027-04-01",
                  "notificationScheduledAt": "2027-02-01T09:00:00",
                  "notificationSentAt": "2027-02-01T09:05:00",
                  "reason": "Annual rent revision",
                  "tenantResponse": "Tenant disputes unexpected increase",
                  "ownerNotes": "Owner must review tenant response",
                  "status": "DISPUTED"
                }
                """.formatted(organizationId, tenantId, unitId, agreementId), tenantToken, 200);

        JsonNode approval = postJson("/approvals", """
                {
                  "organizationId": "%s",
                  "type": "RENT_DISCOUNT",
                  "subject": "February rent adjustment",
                  "details": "Tenant requested a one-time adjustment",
                  "requesterEmail": "%s",
                  "approverEmail": "%s"
                }
                """.formatted(organizationId, tenantEmail, adminEmail), ownerToken, 201);
        String approvalId = id(approval);

        postJson("/approvals/" + approvalId + "/approve", """
                {
                  "comment": "Approved for integration test data"
                }
                """, adminToken, 200);

        mockMvc.perform(get("/approvals/{id}", approvalId).header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        JsonNode bookingApprovals = postJson("/booking-requests", """
                {
                  "propertyId": "%s",
                  "unitId": "%s",
                  "visitDate": "2099-01-20",
                  "visitTime": "10:15:00",
                  "note": "Generated by module integration test"
                }
                """.formatted(propertyId, unitId), tenantToken, 201);

        mockMvc.perform(get("/approvals?status=PENDING").header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(bookingApprovals.size())));

        assertGetById("/payments", paymentId, adminToken);
        assertGetById("/deposit-disputes", depositDisputeId, adminToken);
        assertGetById("/rent-increases", rentIncreaseId, adminToken);
        assertGetById("/invoices", invoiceId, adminToken);
        assertGetById("/agreements", agreementId, adminToken);
        assertGetById("/tenants", tenantId, adminToken);
        assertGetById("/units", unitId, adminToken);
        assertGetById("/buildings", buildingId, adminToken);
        assertGetById("/properties", propertyId, adminToken);
        assertGetById("/users", tenantUserId, adminToken);

        mockMvc.perform(get("/properties/{id}", propertyId).header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(jsonPath("$.imageUrl").value(propertyImage));
        mockMvc.perform(get("/tenants/{id}", tenantId).header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(jsonPath("$.idProofUrl").value(idProofImage))
                .andExpect(jsonPath("$.addressProofUrl").value(addressProofImage));
        mockMvc.perform(get("/deposit-disputes/{id}", depositDisputeId).header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(jsonPath("$.evidenceUrl").value(disputeEvidenceImage));

        // Admin deletion is verified in dependency-safe order across every CRUD module.
        deleteRecord("/payments", paymentId, adminToken);
        deleteRecord("/complaints", complaintId, adminToken);
        deleteRecord("/deposit-disputes", depositDisputeId, adminToken);
        deleteRecord("/rent-increases", rentIncreaseId, adminToken);
        deleteRecord("/approvals", approvalId, adminToken);
        deleteRecord("/invoices", invoiceId, adminToken);
        deleteRecord("/agreements", agreementId, adminToken);
        deleteRecord("/tenants", tenantId, adminToken);
        deleteRecord("/units", unitId, adminToken);
        deleteRecord("/buildings", buildingId, adminToken);
        deleteRecord("/properties", propertyId, adminToken);
        deleteRecord("/users", tenantUserId, adminToken);
        deleteRecord("/users", ownerUserId, adminToken);
        deleteRecord("/organizations", organizationId, adminToken);
    }

    @Test
    void rejectsUnauthenticatedModuleAccess() throws Exception {
        mockMvc.perform(get("/organizations"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ownerCannotEscalateToAdminRole() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "esc-admin-" + suffix + "@example.com";
        String ownerEmail = "esc-owner-" + suffix + "@example.com";

        register(adminEmail, "ADMIN", null);
        String adminToken = login(adminEmail);

        JsonNode organization = postJson("/organizations", """
                {
                  "name": "Escalation Test Rentals",
                  "address": "7 Privilege Path",
                  "phone": "5550600",
                  "email": "esc-%s@example.com"
                }
                """.formatted(suffix), adminToken, 201);
        String organizationId = id(organization);

        JsonNode ownerUser = postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Escape Owner",
                  "email": "%s",
                  "password": "Password123!",
                  "role": "OWNER",
                  "phone": "5550611"
                }
                """.formatted(organizationId, ownerEmail), adminToken, 201);
        String ownerUserId = id(ownerUser);
        String ownerToken = login(ownerEmail);

        postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Sneaky Admin",
                  "email": "sneaky-admin-%s@example.com",
                  "password": "Password123!",
                  "role": "ADMIN"
                }
                """.formatted(organizationId, suffix), ownerToken, 403);

        putJson("/users/" + ownerUserId, """
                {
                  "organizationId": "%s",
                  "name": "Escape Owner",
                  "email": "%s",
                  "role": "ADMIN",
                  "phone": "5550612"
                }
                """.formatted(organizationId, ownerEmail), ownerToken, 403);

        JsonNode allUsers = objectMapper.readTree(mockMvc.perform(
                        get("/users").header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        String adminUserId = null;
        for (JsonNode user : allUsers) {
            if (adminEmail.equals(user.at("/email").asText())) {
                adminUserId = user.at("/id").asText();
            }
        }
        org.junit.jupiter.api.Assertions.assertNotNull(adminUserId);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/users/{id}", adminUserId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isForbidden());

        putJson("/users/" + ownerUserId, """
                {
                  "organizationId": "%s",
                  "name": "Escape Owner Updated",
                  "email": "%s",
                  "role": "OWNER",
                  "phone": "5550613"
                }
                """.formatted(organizationId, ownerEmail), adminToken, 200);
    }

    @Test
    void ownerDataAccessIsScopedToTheirOrganization() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "scope-admin-" + suffix + "@example.com";
        String ownerEmail = "scope-owner-" + suffix + "@example.com";

        register(adminEmail, "ADMIN", null);
        String adminToken = login(adminEmail);

        JsonNode organizationA = postJson("/organizations", """
                {
                  "name": "Scope Org A",
                  "address": "1 Boundary Blvd",
                  "phone": "5550700",
                  "email": "scope-a-%s@example.com"
                }
                """.formatted(suffix), adminToken, 201);
        String organizationAId = id(organizationA);

        JsonNode organizationB = postJson("/organizations", """
                {
                  "name": "Scope Org B",
                  "address": "2 Boundary Blvd",
                  "phone": "5550701",
                  "email": "scope-b-%s@example.com"
                }
                """.formatted(suffix), adminToken, 201);
        String organizationBId = id(organizationB);

        JsonNode ownerUser = postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Scoped Owner",
                  "email": "%s",
                  "password": "Password123!",
                  "role": "OWNER",
                  "phone": "5550711"
                }
                """.formatted(organizationAId, ownerEmail), adminToken, 201);
        String ownerUserId = id(ownerUser);
        String ownerToken = login(ownerEmail);

        JsonNode propertyA = postJson("/properties", propertyBody(organizationAId, ownerUserId, "Org A Property"), adminToken, 201);
        JsonNode propertyB = postJson("/properties", propertyBody(organizationBId, ownerUserId, "Org B Property"), adminToken, 201);
        JsonNode buildingA = postJson("/buildings", """
                { "organizationId": "%s", "propertyId": "%s", "name": "Building A", "floors": 2 }
                """.formatted(organizationAId, id(propertyA)), adminToken, 201);
        JsonNode buildingB = postJson("/buildings", """
                { "organizationId": "%s", "propertyId": "%s", "name": "Building B", "floors": 3 }
                """.formatted(organizationBId, id(propertyB)), adminToken, 201);
        postJson("/units", """
                { "organizationId": "%s", "buildingId": "%s", "unitNumber": "A-1", "rentAmount": 12000, "status": "AVAILABLE" }
                """.formatted(organizationAId, id(buildingA)), adminToken, 201);
        postJson("/units", """
                { "organizationId": "%s", "buildingId": "%s", "unitNumber": "B-1", "rentAmount": 14000, "status": "AVAILABLE" }
                """.formatted(organizationBId, id(buildingB)), adminToken, 201);

        MvcResult listResult = mockMvc.perform(get("/properties").header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode properties = objectMapper.readTree(listResult.getResponse().getContentAsString());
        org.junit.jupiter.api.Assertions.assertEquals(1, properties.size());
        org.junit.jupiter.api.Assertions.assertEquals("Org A Property", properties.get(0).at("/name").asText());

        mockMvc.perform(get("/users").header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/organizations").header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
                .andExpect(status().isForbidden());

        String marketplaceTenantEmail = "market-tenant-" + suffix + "@example.com";
        register(marketplaceTenantEmail, "TENANT", null);
        String marketplaceTenantToken = login(marketplaceTenantEmail);
        mockMvc.perform(get("/properties").header(HttpHeaders.AUTHORIZATION, bearer(marketplaceTenantToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
        mockMvc.perform(get("/buildings").header(HttpHeaders.AUTHORIZATION, bearer(marketplaceTenantToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
        mockMvc.perform(get("/units").header(HttpHeaders.AUTHORIZATION, bearer(marketplaceTenantToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void rejectsPrivilegedPublicRegistrationAfterInitialAccount() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        register("initial-admin-" + suffix + "@example.com", "ADMIN", null);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Unauthorized Admin",
                                  "email": "second-admin-%s@example.com",
                                  "password": "Password123!",
                                  "role": "ADMIN"
                                }
                                """.formatted(suffix)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Unauthorized Owner",
                                  "email": "self-owner-%s@example.com",
                                  "password": "Password123!",
                                  "role": "OWNER"
                                }
                                """.formatted(suffix)))
                .andExpect(status().isForbidden());
    }

    @Test
    void duplicateRegistrationReturnsFriendlyConflictWithoutDatabaseDetails() throws Exception {
        String email = "duplicate-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        register(email, "ADMIN", null);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Duplicate User",
                                  "email": "%s",
                                  "password": "Password123!",
                                  "role": "TENANT"
                                }
                                """.formatted(email)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "An account with this email already exists. Please sign in or use another email."))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("insert into"))))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("constraint"))));
    }

    @Test
    void validatesRequiredFieldsOnSampleData() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "validator-" + suffix + "@example.com";

        register(adminEmail, "ADMIN", null);
        String adminToken = login(adminEmail);

        mockMvc.perform(post("/organizations")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "address": "Missing required name"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.validationErrors.name").exists());
    }

    @Test
    void createdComplaintKeepsOrganizationTenantAndUnitIds() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "complaint-admin-" + suffix + "@example.com";
        String ownerEmail = "complaint-owner-" + suffix + "@example.com";
        String tenantEmail = "complaint-tenant-" + suffix + "@example.com";

        register(adminEmail, "ADMIN", null);
        String adminToken = login(adminEmail);

        JsonNode organization = postJson("/organizations", """
                {
                  "name": "Complaint Test Rentals",
                  "address": "51 Service Lane",
                  "phone": "5550400",
                  "email": "complaint-%s@example.com"
                }
                """.formatted(suffix), adminToken, 201);
        String organizationId = id(organization);

        JsonNode ownerUser = postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Complaint Owner",
                  "email": "%s",
                  "password": "Password123!",
                  "role": "OWNER",
                  "phone": "5550411"
                }
                """.formatted(organizationId, ownerEmail), adminToken, 201);
        String ownerUserId = id(ownerUser);

        JsonNode tenantUser = postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Complaint Tenant",
                  "email": "%s",
                  "password": "Password123!",
                  "role": "TENANT",
                  "phone": "5550422"
                }
                """.formatted(organizationId, tenantEmail), adminToken, 201);
        String tenantUserId = id(tenantUser);
        String tenantToken = login(tenantEmail);

        JsonNode property = postJson("/properties", """
                {
                  "organizationId": "%s",
                  "ownerId": "%s",
                  "name": "Complaint Property",
                  "address": "12 Repair Road",
                  "city": "Pune",
                  "state": "MH"
                }
                """.formatted(organizationId, ownerUserId), adminToken, 201);
        String propertyId = id(property);

        JsonNode building = postJson("/buildings", """
                {
                  "organizationId": "%s",
                  "propertyId": "%s",
                  "name": "Complaint Tower",
                  "floors": 5
                }
                """.formatted(organizationId, propertyId), adminToken, 201);
        String buildingId = id(building);

        JsonNode unit = postJson("/units", """
                {
                  "organizationId": "%s",
                  "buildingId": "%s",
                  "unitNumber": "C-305",
                  "rentAmount": 15000.00,
                  "status": "OCCUPIED"
                }
                """.formatted(organizationId, buildingId), adminToken, 201);
        String unitId = id(unit);

        JsonNode tenant = postJson("/tenants", """
                {
                  "organizationId": "%s",
                  "userId": "%s",
                  "unitId": "%s",
                  "fullName": "Complaint Tenant",
                  "phone": "5550422",
                  "emergencyContact": "5550888"
                }
                """.formatted(organizationId, tenantUserId, unitId), adminToken, 201);
        String tenantId = id(tenant);

        JsonNode complaint = postJson("/complaints", """
                {
                  "organizationId": "%s",
                  "tenantId": "%s",
                  "unitId": "%s",
                  "title": "Bathroom exhaust not working",
                  "description": "Fan stopped working after power fluctuation",
                  "status": "OPEN"
                }
                """.formatted(organizationId, tenantId, unitId), tenantToken, 201);
        String complaintId = id(complaint);

        mockMvc.perform(get("/complaints/{id}", complaintId).header(HttpHeaders.AUTHORIZATION, bearer(tenantToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizationId").value(organizationId))
                .andExpect(jsonPath("$.tenantId").value(tenantId))
                .andExpect(jsonPath("$.unitId").value(unitId))
                .andExpect(jsonPath("$.title").value("Bathroom exhaust not working"))
                .andExpect(jsonPath("$.aiPriority").value(org.hamcrest.Matchers.anyOf(
                        org.hamcrest.Matchers.is("EMERGENCY"),
                        org.hamcrest.Matchers.is("HIGH"),
                        org.hamcrest.Matchers.is("MEDIUM"),
                        org.hamcrest.Matchers.is("LOW"))))
                .andExpect(jsonPath("$.aiCategory").isNotEmpty())
                .andExpect(jsonPath("$.aiNote").isNotEmpty());
    }

    @Test
    void rolePermissionMatrixCoversAllModuleCategories() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "matrix-admin-" + suffix + "@example.com";
        String ownerEmail = "matrix-owner-" + suffix + "@example.com";
        String tenantEmail = "matrix-tenant-" + suffix + "@example.com";

        register(adminEmail, "ADMIN", null);
        String adminToken = login(adminEmail);

        JsonNode organization = postJson("/organizations", """
                {
                  "name": "Matrix Rentals",
                  "address": "15 Role Street",
                  "phone": "5550300",
                  "email": "matrix-%s@example.com"
                }
                """.formatted(suffix), adminToken, 201);
        String organizationId = id(organization);

        JsonNode ownerUser = postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Matrix Owner",
                  "email": "%s",
                  "password": "Password123!",
                  "role": "OWNER",
                  "phone": "5550311"
                }
                """.formatted(organizationId, ownerEmail), adminToken, 201);
        String ownerUserId = id(ownerUser);
        String ownerToken = login(ownerEmail);

        postJson("/users", """
                {
                  "organizationId": "%s",
                  "name": "Matrix Tenant",
                  "email": "%s",
                  "password": "Password123!",
                  "role": "TENANT",
                  "phone": "5550322"
                }
                """.formatted(organizationId, tenantEmail), adminToken, 201);
        String tenantToken = login(tenantEmail);

        JsonNode property = postJson("/properties", """
                {
                  "organizationId": "%s",
                  "ownerId": "%s",
                  "name": "Matrix Property",
                  "address": "90 Access Road",
                  "city": "Pune",
                  "state": "MH"
                }
                """.formatted(organizationId, ownerUserId), adminToken, 201);
        String propertyId = id(property);

        JsonNode building = postJson("/buildings", """
                {
                  "organizationId": "%s",
                  "propertyId": "%s",
                  "name": "Matrix Tower",
                  "floors": 4
                }
                """.formatted(organizationId, propertyId), adminToken, 201);
        String buildingId = id(building);

        JsonNode unit = postJson("/units", """
                {
                  "organizationId": "%s",
                  "buildingId": "%s",
                  "unitNumber": "M-101",
                  "rentAmount": 12000.00,
                  "status": "AVAILABLE"
                }
                """.formatted(organizationId, buildingId), adminToken, 201);
        String unitId = id(unit);

        assertRoleAccess("/organizations", 200, 403, 403, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/users", 200, 403, 403, adminToken, ownerToken, tenantToken);

        assertRoleAccess("/properties", 200, 200, 200, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/buildings", 200, 200, 200, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/units", 200, 200, 200, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/complaints", 200, 200, 403, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/deposit-disputes", 200, 200, 403, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/rent-increases", 200, 200, 403, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/complaints/me", 403, 403, 200, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/deposit-disputes/me", 403, 403, 200, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/rent-increases/me", 403, 403, 200, adminToken, ownerToken, tenantToken);

        assertRoleAccess("/tenants", 200, 200, 403, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/agreements", 200, 200, 403, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/invoices", 200, 200, 403, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/payments", 200, 200, 403, adminToken, ownerToken, tenantToken);
        assertRoleAccess("/approvals", 200, 200, 200, adminToken, ownerToken, tenantToken);

        assertCreatePropertyAccess(201, 201, 403, organizationId, ownerUserId, adminToken, ownerToken, tenantToken, suffix);
        assertBookingRequestAccess(201, 201, 201, propertyId, unitId, adminToken, ownerToken, tenantToken);
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
        return readJson(result);
    }

    private JsonNode putJson(String path, String body, String token, int expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(put(path)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is(expectedStatus))
                .andReturn();
        return readJson(result);
    }

    private void assertGetById(String basePath, String id, String token) throws Exception {
        mockMvc.perform(get(basePath + "/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
    }

    private void deleteRecord(String basePath, String id, String token) throws Exception {
        mockMvc.perform(delete(basePath + "/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get(basePath + "/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNotFound());
    }

    private void assertRoleAccess(
            String path,
            int adminStatus,
            int ownerStatus,
            int tenantStatus,
            String adminToken,
            String ownerToken,
            String tenantToken
    ) throws Exception {
        assertAuthenticatedGetStatus(path, adminToken, adminStatus);
        assertAuthenticatedGetStatus(path, ownerToken, ownerStatus);
        assertAuthenticatedGetStatus(path, tenantToken, tenantStatus);
        mockMvc.perform(get(path)).andExpect(status().isUnauthorized());
    }

    private void assertAuthenticatedGetStatus(String path, String token, int expectedStatus) throws Exception {
        mockMvc.perform(get(path).header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().is(expectedStatus));
    }

    private void assertCreatePropertyAccess(
            int adminStatus,
            int ownerStatus,
            int tenantStatus,
            String organizationId,
            String ownerUserId,
            String adminToken,
            String ownerToken,
            String tenantToken,
            String suffix
    ) throws Exception {
        assertPostStatus("/properties", propertyBody(organizationId, ownerUserId, "Admin Matrix Property " + suffix), adminToken, adminStatus);
        assertPostStatus("/properties", propertyBody(organizationId, ownerUserId, "Owner Matrix Property " + suffix), ownerToken, ownerStatus);
        assertPostStatus("/properties", propertyBody(organizationId, ownerUserId, "Tenant Matrix Property " + suffix), tenantToken, tenantStatus);
        mockMvc.perform(post("/properties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(propertyBody(organizationId, ownerUserId, "Anonymous Matrix Property " + suffix)))
                .andExpect(status().isUnauthorized());
    }

    private void assertBookingRequestAccess(
            int adminStatus,
            int ownerStatus,
            int tenantStatus,
            String propertyId,
            String unitId,
            String adminToken,
            String ownerToken,
            String tenantToken
    ) throws Exception {
        String body = """
                {
                  "propertyId": "%s",
                  "unitId": "%s",
                  "visitDate": "2099-02-20",
                  "visitTime": "11:00:00",
                  "note": "Role matrix booking request"
                }
                """.formatted(propertyId, unitId);

        assertPostStatus("/booking-requests", body, adminToken, adminStatus);
        assertPostStatus("/booking-requests", body, ownerToken, ownerStatus);
        assertPostStatus("/booking-requests", body, tenantToken, tenantStatus);
        mockMvc.perform(post("/booking-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    private void assertPostStatus(String path, String body, String token, int expectedStatus) throws Exception {
        mockMvc.perform(post(path)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is(expectedStatus));
    }

    private String propertyBody(String organizationId, String ownerUserId, String name) {
        return """
                {
                  "organizationId": "%s",
                  "ownerId": "%s",
                  "name": "%s",
                  "address": "Role Matrix Avenue",
                  "city": "Pune",
                  "state": "MH"
                }
                """.formatted(organizationId, ownerUserId, name);
    }

    private JsonNode readJson(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private String id(JsonNode node) {
        return node.at("/id").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String testImageDataUrl(String base64Chunk) {
        return "data:image/jpeg;base64," + base64Chunk.repeat(160);
    }
}
