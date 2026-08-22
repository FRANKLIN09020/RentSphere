package com.rentsphere.dto;

import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildingRequest {
    private UUID organizationId;
    private UUID propertyId;
    @NotBlank
    private String name;
    private Integer floors;
    private String imageUrl;
}
