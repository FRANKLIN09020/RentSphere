package com.rentsphere.service;

import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.Agreement;
import com.rentsphere.entity.AgreementStatus;
import com.rentsphere.entity.Invoice;
import com.rentsphere.entity.InvoiceStatus;
import com.rentsphere.entity.UnitStatus;
import com.rentsphere.repository.AgreementRepository;
import com.rentsphere.repository.InvoiceRepository;
import com.rentsphere.repository.TenantRepository;
import com.rentsphere.repository.UnitRepository;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.security.SecurityUtils;

@Service
public class AgreementService extends BaseCrudService<Agreement> {

    private final AgreementRepository agreementRepository;
    private final TenantRepository tenantRepository;
    private final UnitRepository unitRepository;
    private final InvoiceRepository invoiceRepository;

    public AgreementService(AgreementRepository agreementRepository, TenantRepository tenantRepository,
            UnitRepository unitRepository, InvoiceRepository invoiceRepository) {
        super(agreementRepository, "Agreement");
        this.agreementRepository = agreementRepository;
        this.tenantRepository = tenantRepository;
        this.unitRepository = unitRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<Agreement> findAll() {
        return findAllScoped(agreementRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Agreement> findAll(Pageable pageable) {
        if (SecurityUtils.isAdmin()) {
            return agreementRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        UUID organizationId = getCurrentOrganizationId();
        if (organizationId == null) {
            return Page.empty(pageable);
        }
        return agreementRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId, pageable);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {"agreements", "tenants", "units", "invoices"}, allEntries = true)
    public Agreement create(Agreement request) {
        validateRelationships(request);
        Agreement saved = super.create(request);
        activateRentalWorkflow(saved);
        return saved;
    }

    @Override
    @Transactional
    public Agreement update(UUID id, Agreement request) {
        validateRelationships(request);
        return super.update(id, request);
    }

    private void validateRelationships(Agreement agreement) {
        if (agreement.getStartDate() != null && agreement.getEndDate() != null
                && agreement.getEndDate().isBefore(agreement.getStartDate())) {
            throw new IllegalArgumentException("Agreement end date cannot be before its start date");
        }
        if (agreement.getTenantId() == null || agreement.getUnitId() == null) return;
        var tenant = tenantRepository.findById(agreement.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", agreement.getTenantId()));
        var unit = unitRepository.findById(agreement.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Unit", agreement.getUnitId()));
        if (agreement.getOrganizationId() != null
                && (!agreement.getOrganizationId().equals(tenant.getOrganizationId())
                || !agreement.getOrganizationId().equals(unit.getOrganizationId()))) {
            throw new IllegalArgumentException("Agreement tenant and unit must belong to the selected organization");
        }
        if (agreement.getStatus() == AgreementStatus.ACTIVE
                && !"VERIFIED".equalsIgnoreCase(tenant.getKycStatus())) {
            throw new IllegalArgumentException("Tenant KYC must be verified before activating an agreement");
        }
        if (agreement.getStatus() == AgreementStatus.ACTIVE && agreement.getRentAmount() == null) {
            throw new IllegalArgumentException("Rent amount is required for an active agreement");
        }
    }

    private void activateRentalWorkflow(Agreement agreement) {
        if (agreement.getStatus() != AgreementStatus.ACTIVE
                || agreement.getTenantId() == null
                || agreement.getUnitId() == null) return;

        var tenant = tenantRepository.findById(agreement.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", agreement.getTenantId()));
        var unit = unitRepository.findById(agreement.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Unit", agreement.getUnitId()));
        boolean firstUnitAssignment = tenant.getUnitId() == null;
        tenant.setOrganizationId(agreement.getOrganizationId());
        tenant.setUnitId(unit.getId());
        tenantRepository.save(tenant);
        unit.setStatus(UnitStatus.OCCUPIED);
        unitRepository.save(unit);

        if (firstUnitAssignment && !invoiceRepository.existsByAgreementId(agreement.getId())) {
            invoiceRepository.save(Invoice.builder()
                    .organizationId(agreement.getOrganizationId())
                    .tenantId(tenant.getId())
                    .agreementId(agreement.getId())
                    .amount(agreement.getRentAmount())
                    .dueDate(agreement.getStartDate())
                    .status(InvoiceStatus.PENDING)
                    .build());
        }
    }

    @Override
    protected void applyUpdates(Agreement entity, Agreement request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setUnitId(request.getUnitId());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());
        entity.setRentAmount(request.getRentAmount());
        entity.setStatus(request.getStatus());
    }
}
