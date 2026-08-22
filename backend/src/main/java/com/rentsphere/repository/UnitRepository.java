package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Unit;

public interface UnitRepository extends JpaRepository<Unit, UUID> {
    List<Unit> findByOrganizationId(UUID organizationId);

    List<Unit> findByBuildingId(UUID buildingId);
}
