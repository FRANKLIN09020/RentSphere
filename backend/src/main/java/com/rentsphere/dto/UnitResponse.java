package com.rentsphere.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import com.rentsphere.entity.UnitStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitResponse {
    private UUID id;
    private UUID organizationId;
    private UUID buildingId;
    private String unitNumber;
    private BigDecimal rentAmount;
    private UnitStatus status;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
