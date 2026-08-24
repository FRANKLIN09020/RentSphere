package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Complaint;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
    List<Complaint> findByOrganizationId(UUID organizationId);

    Page<Complaint> findByOrganizationId(UUID organizationId, Pageable pageable);

    List<Complaint> findByTenantId(UUID tenantId);
}
