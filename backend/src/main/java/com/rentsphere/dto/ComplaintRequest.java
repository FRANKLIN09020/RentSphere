package com.rentsphere.dto;

import java.util.UUID;
import com.rentsphere.entity.ComplaintStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintRequest {
    private UUID organizationId;
    private UUID tenantId;
    private UUID unitId;
    @NotBlank
    private String title;
    private String description;
    private ComplaintStatus status;
}
