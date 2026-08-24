package com.rentsphere.entity;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@org.hibernate.annotations.SQLRestriction("deleted = false")
@Table(name = "buildings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Building extends BaseEntity {

    private UUID organizationId;

    private UUID propertyId;

    @jakarta.persistence.Column(nullable = false)
    @NotBlank
    private String name;

    private Integer floors;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String imageUrl;
}
