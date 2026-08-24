package com.rentsphere.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

import com.rentsphere.entity.RentIncrease;
import com.rentsphere.repository.RentIncreaseRepository;

@Service
public class RentIncreaseService extends BaseCrudService<RentIncrease> {
    private final RentIncreaseRepository rentIncreaseRepository;

    public RentIncreaseService(RentIncreaseRepository rentIncreaseRepository) {
        super(rentIncreaseRepository, "Rent increase");
        this.rentIncreaseRepository = rentIncreaseRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<RentIncrease> findAll() {
        return findAllScoped(rentIncreaseRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RentIncrease> findAll(Pageable pageable) {
        return findAllScoped(pageable, rentIncreaseRepository::findByOrganizationId);
    }

    public List<RentIncrease> findByTenantId(UUID tenantId) {
        return rentIncreaseRepository.findByTenantId(tenantId);
    }

    @Override
    public String getCacheName() {
        return "rentIncreases";
    }

    @Override
    protected void applyUpdates(RentIncrease entity, RentIncrease request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setUnitId(request.getUnitId());
        entity.setAgreementId(request.getAgreementId());
        entity.setPreviousRent(request.getPreviousRent());
        entity.setProposedRent(request.getProposedRent());
        entity.setNoticeDate(request.getNoticeDate());
        entity.setEffectiveDate(request.getEffectiveDate());
        entity.setNotificationScheduledAt(request.getNotificationScheduledAt());
        entity.setNotificationSentAt(request.getNotificationSentAt());
        entity.setReason(request.getReason());
        entity.setTenantResponse(request.getTenantResponse());
        entity.setOwnerNotes(request.getOwnerNotes());
        entity.setStatus(request.getStatus());
    }
}
