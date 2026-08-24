package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Tenant;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    List<Tenant> findByOrganizationId(UUID organizationId);

    Page<Tenant> findByOrganizationId(UUID organizationId, Pageable pageable);

    List<Tenant> findByUserId(UUID userId);
}
