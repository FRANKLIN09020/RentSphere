package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Unit;

public interface UnitRepository extends JpaRepository<Unit, UUID> {
    List<Unit> findByOrganizationId(UUID organizationId);

    Page<Unit> findByOrganizationId(UUID organizationId, Pageable pageable);

    List<Unit> findByBuildingId(UUID buildingId);
}
