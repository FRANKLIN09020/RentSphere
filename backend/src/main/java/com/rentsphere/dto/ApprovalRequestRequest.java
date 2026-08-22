package com.rentsphere.dto;

import java.util.UUID;
import com.rentsphere.entity.ApprovalStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequestRequest {
    private UUID organizationId;
    @NotBlank
    private String type;
    @NotBlank
    private String subject;
    private String details;
    @Email
    @NotBlank
    private String requesterEmail;
    @Email
    @NotBlank
    private String approverEmail;
    @NotNull
    private ApprovalStatus status;
}
