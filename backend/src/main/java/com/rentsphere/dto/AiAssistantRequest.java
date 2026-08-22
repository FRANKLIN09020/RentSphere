package com.rentsphere.dto;

import jakarta.validation.constraints.NotBlank;

public record AiAssistantRequest(
        @NotBlank(message = "Message is required") String message,
        String context) {
}
