package com.rentsphere.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@org.hibernate.annotations.SQLRestriction("deleted = false")
@Table(name = "deposit_disputes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepositDispute extends BaseEntity {

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

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String evidenceUrl;

    private String tenantNotes;

    private String ownerResponse;

    private LocalDate settlementDueDate;

    @Enumerated(EnumType.STRING)
    private DepositDisputeStatus status;
}
