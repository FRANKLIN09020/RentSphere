package com.rentsphere.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantRequest {
    private UUID organizationId;
    private UUID userId;
    private UUID unitId;
    private String fullName;
    private String phone;
    private String emergencyContact;
    private String kycStatus;
    private String idProofUrl;
    private String addressProofUrl;
}
