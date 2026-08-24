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
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property extends BaseEntity {

    private UUID organizationId;

    private UUID ownerId;

    @jakarta.persistence.Column(nullable = false)
    @NotBlank
    private String name;

    @jakarta.persistence.Column(nullable = false)
    @NotBlank
    private String address;

    private String city;

    private String state;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String amenities;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String imageUrl;
}
