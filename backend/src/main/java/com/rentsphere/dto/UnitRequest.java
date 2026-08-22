package com.rentsphere.dto;

import java.math.BigDecimal;
import java.util.UUID;
import com.rentsphere.entity.UnitStatus;
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
public class UnitRequest {
    private UUID organizationId;
    private UUID buildingId;
    @NotBlank
    private String unitNumber;
    @NotNull
    private BigDecimal rentAmount;
    private UnitStatus status;
    private String imageUrl;
}
