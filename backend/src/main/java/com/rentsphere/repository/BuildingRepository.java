package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Building;

public interface BuildingRepository extends JpaRepository<Building, UUID> {
    List<Building> findByOrganizationId(UUID organizationId);

    List<Building> findByPropertyId(UUID propertyId);
}
