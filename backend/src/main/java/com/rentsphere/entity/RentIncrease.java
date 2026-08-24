package com.rentsphere.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
@Table(name = "rent_increases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentIncrease extends BaseEntity {

    private UUID organizationId;

    private UUID tenantId;

    private UUID unitId;

    private UUID agreementId;

    private BigDecimal previousRent;

    private BigDecimal proposedRent;

    private LocalDate noticeDate;

    private LocalDate effectiveDate;

    private LocalDateTime notificationScheduledAt;

    private LocalDateTime notificationSentAt;

    private String reason;

    private String tenantResponse;

    private String ownerNotes;

    @Enumerated(EnumType.STRING)
    private RentIncreaseStatus status;
}
