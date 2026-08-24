package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Property;

public interface PropertyRepository extends JpaRepository<Property, UUID> {
    List<Property> findByOrganizationId(UUID organizationId);

    Page<Property> findByOrganizationId(UUID organizationId, Pageable pageable);

    List<Property> findByOwnerId(UUID ownerId);
}
