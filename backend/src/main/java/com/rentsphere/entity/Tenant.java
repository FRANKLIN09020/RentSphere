package com.rentsphere.entity;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@org.hibernate.annotations.SQLRestriction("deleted = false")
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant extends BaseEntity {

    private UUID organizationId;

    @jakarta.persistence.Column(unique = true)
    private UUID userId;

    private UUID unitId;

    private String fullName;

    private String phone;

    private String emergencyContact;

    private String kycStatus;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String idProofUrl;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String addressProofUrl;
}
