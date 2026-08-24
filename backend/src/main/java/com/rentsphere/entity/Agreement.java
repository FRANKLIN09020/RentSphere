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
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "agreements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("deleted = false")
public class Agreement extends BaseEntity {

    private UUID organizationId;

    private UUID tenantId;

    private UUID unitId;

    private LocalDate startDate;

    private LocalDate endDate;

    private BigDecimal rentAmount;

    @Enumerated(EnumType.STRING)
    private AgreementStatus status;
}
