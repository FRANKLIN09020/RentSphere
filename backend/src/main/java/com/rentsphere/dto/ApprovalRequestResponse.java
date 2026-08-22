package com.rentsphere.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import com.rentsphere.entity.ApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequestResponse {
    private UUID id;
    private UUID organizationId;
    private String type;
    private String subject;
    private String details;
    private String requesterEmail;
    private String approverEmail;
    private ApprovalStatus status;
    private String decisionComment;
    private LocalDateTime decidedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
