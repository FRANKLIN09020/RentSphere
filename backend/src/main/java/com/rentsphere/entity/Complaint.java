package com.rentsphere.entity;

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

@Entity
@org.hibernate.annotations.SQLRestriction("deleted = false")
@Table(name = "complaints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint extends BaseEntity {

    private UUID organizationId;

    private UUID tenantId;

    private UUID unitId;

    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    private ComplaintStatus status;

    @jakarta.persistence.Column(length = 20)
    private String aiPriority;

    @jakarta.persistence.Column(length = 20)
    private String aiCategory;

    @jakarta.persistence.Column(length = 240)
    private String aiNote;
}
