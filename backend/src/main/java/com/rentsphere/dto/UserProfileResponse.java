package com.rentsphere.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.rentsphere.entity.UserRole;

public record UserProfileResponse(
        UUID id,
        String name,
        String email,
        String phone,
        UserRole role,
        UUID organizationId,
        String organizationName,
        LocalDateTime createdAt) {
}
