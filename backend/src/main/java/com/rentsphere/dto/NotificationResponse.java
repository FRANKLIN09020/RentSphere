package com.rentsphere.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(UUID id, String title, String detail, String type, String targetPath, LocalDateTime createdAt, boolean read) {}
