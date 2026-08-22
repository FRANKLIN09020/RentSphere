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
public class PropertyRequest {
    private UUID organizationId;
    private UUID ownerId;
    @NotBlank
    private String name;
    @NotBlank
    private String address;
    private String city;
    private String state;
    private String amenities;
    private String imageUrl;
}
