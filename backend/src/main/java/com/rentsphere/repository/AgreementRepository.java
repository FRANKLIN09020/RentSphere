package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Agreement;

public interface AgreementRepository extends JpaRepository<Agreement, UUID> {

    Page<Agreement> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Agreement> findByOrganizationId(UUID organizationId);

    Page<Agreement> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

    List<Agreement> findByTenantId(UUID tenantId);
}
