package com.rentsphere.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

@MappedSuperclass
@EntityListeners(AuditListener.class)
@SQLRestriction("deleted = false")
@Getter
@Setter
public abstract class BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private UUID createdBy;

    private UUID updatedBy;

    private UUID deletedBy;

    private LocalDateTime deletedAt;

    @Column(nullable = false)
    private boolean deleted = false;
}