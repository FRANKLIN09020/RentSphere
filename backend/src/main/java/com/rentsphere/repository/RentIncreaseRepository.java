package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.RentIncrease;

public interface RentIncreaseRepository extends JpaRepository<RentIncrease, UUID> {
    List<RentIncrease> findByOrganizationId(UUID organizationId);

    Page<RentIncrease> findByOrganizationId(UUID organizationId, Pageable pageable);

    List<RentIncrease> findByTenantId(UUID tenantId);
}
