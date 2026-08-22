package com.rentsphere.dto;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

import com.rentsphere.entity.Unit;
import com.rentsphere.entity.UnitStatus;

class DtoMapperTest {

    @Test
    void mapsUnitImageUrlBetweenEntityAndDto() {
        Unit entity = Unit.builder()
                .organizationId(UUID.randomUUID())
                .buildingId(UUID.randomUUID())
                .unitNumber("101")
                .rentAmount(new BigDecimal("1200.00"))
                .status(UnitStatus.AVAILABLE)
                .imageUrl("https://example.com/unit.jpg")
                .build();

        UnitResponse response = DtoMapper.toResponse(entity);
        assertEquals("https://example.com/unit.jpg", response.getImageUrl());

        UnitRequest request = UnitRequest.builder()
                .organizationId(entity.getOrganizationId())
                .buildingId(entity.getBuildingId())
                .unitNumber("102")
                .rentAmount(new BigDecimal("1400.00"))
                .status(UnitStatus.OCCUPIED)
                .imageUrl("https://example.com/updated.jpg")
                .build();

        Unit mapped = DtoMapper.toEntity(request);
        assertEquals("https://example.com/updated.jpg", mapped.getImageUrl());
    }
}
