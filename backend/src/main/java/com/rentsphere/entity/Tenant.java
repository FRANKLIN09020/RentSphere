package com.rentsphere.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
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
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditListener.class)
@SQLRestriction("deleted = false")
public class Tenant implements AuditListener.BaseAuditable {

    @Id
    @GeneratedValue
    private UUID id;

    private UUID organizationId;

    @Column(unique = true)
    private UUID userId;

    private UUID unitId;

    private String fullName;

    private String phone;

    private String emergencyContact;

    private String kycStatus;

    @Column(columnDefinition = "TEXT")
    private String idProofUrl;

    @Column(columnDefinition = "TEXT")
    private String addressProofUrl;

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
