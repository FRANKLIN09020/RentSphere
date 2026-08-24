package com.rentsphere.service;

import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.Agreement;
import com.rentsphere.repository.AgreementRepository;
import com.rentsphere.repository.TenantRepository;
import com.rentsphere.repository.UnitRepository;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.security.SecurityUtils;

@Service
public class AgreementService extends BaseCrudService<Agreement> {

    private final AgreementRepository agreementRepository;
    private final TenantRepository tenantRepository;
    private final UnitRepository unitRepository;

    public AgreementService(AgreementRepository agreementRepository, TenantRepository tenantRepository, UnitRepository unitRepository) {
        super(agreementRepository, "Agreement");
        this.agreementRepository = agreementRepository;
        this.tenantRepository = tenantRepository;
        this.unitRepository = unitRepository;
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
    public Agreement create(Agreement request) {
        validateRelationships(request);
        return super.create(request);
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
