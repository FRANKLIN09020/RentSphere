package com.rentsphere.entity;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@org.hibernate.annotations.SQLRestriction("deleted = false")
@Table(name = "units")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Unit extends BaseEntity {

    private UUID organizationId;

    private UUID buildingId;

    @jakarta.persistence.Column(nullable = false)
    @NotBlank
    private String unitNumber;

    @jakarta.persistence.Column(nullable = false)
    @NotNull
    private BigDecimal rentAmount;

    @Enumerated(EnumType.STRING)
    private UnitStatus status;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String imageUrl;
}
