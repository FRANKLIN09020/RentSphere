package com.rentsphere.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@org.hibernate.annotations.SQLRestriction("deleted = false")
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice extends BaseEntity {

    private UUID organizationId;

    private UUID tenantId;

    private UUID agreementId;

    @jakarta.persistence.Column(nullable = false)
    @NotNull
    private BigDecimal amount;

    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status;
}
