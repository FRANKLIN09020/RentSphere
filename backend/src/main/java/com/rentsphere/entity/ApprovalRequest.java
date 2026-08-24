package com.rentsphere.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@org.hibernate.annotations.SQLRestriction("deleted = false")
@Table(name = "approval_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalRequest extends BaseEntity {

    private UUID organizationId;

    @NotBlank
    private String type;

    @NotBlank
    private String subject;

    @jakarta.persistence.Column(length = 2000)
    private String details;

    @Email
    @NotBlank
    private String requesterEmail;

    @Email
    @NotBlank
    private String approverEmail;

    @NotNull
    @Enumerated(EnumType.STRING)
    private ApprovalStatus status;

    @jakarta.persistence.Column(length = 1000)
    private String decisionComment;

    private LocalDateTime decidedAt;
}
