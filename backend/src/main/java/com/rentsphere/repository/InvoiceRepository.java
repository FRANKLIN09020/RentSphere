package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByOrganizationId(UUID organizationId);

    List<Invoice> findByTenantId(UUID tenantId);
}
