package com.rentsphere.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import com.rentsphere.entity.DepositDisputeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositDisputeResponse {
    private UUID id;
    private UUID organizationId;
    private UUID tenantId;
    private UUID unitId;
    private UUID agreementId;
    private BigDecimal depositAmount;
    private BigDecimal deductedAmount;
    private BigDecimal ownerRepairEstimate;
    private BigDecimal marketRepairEstimate;
    private BigDecimal proposedSettlementAmount;
    private String deductionReason;
    private String evidenceUrl;
    private String tenantNotes;
    private String ownerResponse;
    private LocalDate settlementDueDate;
    private DepositDisputeStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
