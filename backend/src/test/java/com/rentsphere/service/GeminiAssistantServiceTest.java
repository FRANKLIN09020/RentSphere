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
}
