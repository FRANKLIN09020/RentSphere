package com.rentsphere.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import com.rentsphere.entity.AgreementStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgreementResponse {
    private UUID id;
    private UUID organizationId;
    private UUID tenantId;
    private UUID unitId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal rentAmount;
    private AgreementStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
