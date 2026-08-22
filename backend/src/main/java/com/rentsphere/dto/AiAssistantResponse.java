package com.rentsphere.dto;

public record AiAssistantResponse(
        String reply,
        boolean usedFallback,
        String model) {
}
