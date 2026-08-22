package com.rentsphere.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;
import jakarta.persistence.EntityListeners;

@Entity
@Table(name = "rent_increases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditListener.class)
@SQLRestriction("deleted = false")
public class RentIncrease implements AuditListener.BaseAuditable {

    @Id
    @GeneratedValue
    private UUID id;

    private UUID organizationId;

    private UUID tenantId;

    private UUID unitId;

    private UUID agreementId;

    private BigDecimal previousRent;

    private BigDecimal proposedRent;

    private BigDecimal increaseAmount;

    private BigDecimal increasePercent;

    private LocalDate noticeDate;

    private LocalDate effectiveDate;

    private LocalDateTime notificationScheduledAt;

    private LocalDateTime notificationSentAt;

    private String reason;

    private String tenantResponse;

    private String ownerNotes;

    @Enumerated(EnumType.STRING)
    private RentIncreaseStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(updatable = false)
    private UUID createdBy;

    private UUID updatedBy;

    private UUID deletedBy;

    private LocalDateTime deletedAt;

    @Column(nullable = false)
    private boolean deleted = false;
}
