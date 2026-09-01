package com.rentsphere.service;

import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.rentsphere.dto.AiAssistantRequest;

class GeminiAssistantServiceTest {

    @Test
    void fallbackReplyProvidesPracticalRentalGuidance() {
        GeminiAssistantService service = new GeminiAssistantService();
        AiAssistantRequest request = new AiAssistantRequest("What is the notice period for leaving the apartment?", "lease details");

        var response = service.buildFallbackReply(request, "quota limit reached");

        assertTrue(response.usedFallback());
        assertTrue(response.reply().toLowerCase().contains("lease") || response.reply().toLowerCase().contains("notice"));
    }

    @Test
    void personalRentQuestionUsesLinkedAgreementAndInvoiceRecords() {
        GeminiAssistantService service = new GeminiAssistantService();
        AiAssistantRequest request = new AiAssistantRequest("Show my current rent and invoices", "");
        String context = """
                PERSONAL DATA FOR THE CURRENTLY LOGGED-IN USER
                Tenant profile: KYC status VERIFIED
                Agreements:
                 - status ACTIVE | start 2026-08-24 | end 2027-08-23 | rent 10000.00
                Invoices:
                 - amount 10000.00 | due 2026-08-24 | status PAID
                """;

        var response = service.generateReply(request, context);

        assertTrue(response.reply().contains("₹10000.00"));
        assertTrue(response.reply().contains("PAID"));
        assertTrue(response.reply().contains("ACTIVE"));
    }

    @Test
    void personalRentQuestionExplainsWhenNoRentalRecordsAreLinked() {
        GeminiAssistantService service = new GeminiAssistantService();
        AiAssistantRequest request = new AiAssistantRequest("What is my current rent?", "");

        var response = service.generateReply(request, "Tenant profile: KYC status PENDING\n");

        assertTrue(response.reply().contains("no unit, rental agreement, or invoice"));
    }
}
