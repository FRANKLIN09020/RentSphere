package com.rentsphere.dto;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApprovalCreateRequest {

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
}
