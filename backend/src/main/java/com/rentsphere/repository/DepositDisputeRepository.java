package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.DepositDispute;

public interface DepositDisputeRepository extends JpaRepository<DepositDispute, UUID> {
    List<DepositDispute> findByOrganizationId(UUID organizationId);

    List<DepositDispute> findByTenantId(UUID tenantId);
}
