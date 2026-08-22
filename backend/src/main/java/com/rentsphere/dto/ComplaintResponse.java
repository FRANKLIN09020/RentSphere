package com.rentsphere.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import com.rentsphere.entity.ComplaintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {
    private UUID id;
    private UUID organizationId;
    private UUID tenantId;
    private UUID unitId;
    private String title;
    private String description;
    private ComplaintStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
