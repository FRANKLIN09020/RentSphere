package com.rentsphere.entity;

import java.math.BigDecimal;
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
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;
import jakarta.persistence.EntityListeners;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditListener.class)
@SQLRestriction("deleted = false")
public class Payment implements AuditListener.BaseAuditable {

    @Id
    @GeneratedValue
    private UUID id;

    private UUID organizationId;

    private UUID invoiceId;

    private String razorpayOrderId;

    private String razorpayPaymentId;

    @Column(nullable = false)
    @NotNull
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private LocalDateTime paymentDate;

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
