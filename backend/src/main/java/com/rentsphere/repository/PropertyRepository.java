package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Property;

public interface PropertyRepository extends JpaRepository<Property, UUID> {
    List<Property> findByOrganizationId(UUID organizationId);

    List<Property> findByOwnerId(UUID ownerId);
}
