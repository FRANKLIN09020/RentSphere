package com.rentsphere.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.rentsphere.entity.PropertyType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyResponse {
    private UUID id;
    private UUID organizationId;
    private UUID ownerId;
    private String name;
    private String address;
    private String city;
    private String state;
    private PropertyType propertyType;
    private Double latitude;
    private Double longitude;
    private String amenities;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
