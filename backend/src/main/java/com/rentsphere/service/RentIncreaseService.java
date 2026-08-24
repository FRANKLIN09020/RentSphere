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
    private final NotificationService notificationService;

    public RentIncreaseService(RentIncreaseRepository rentIncreaseRepository,
            NotificationService notificationService) {
        super(rentIncreaseRepository, "Rent increase");
        this.rentIncreaseRepository = rentIncreaseRepository;
        this.notificationService = notificationService;
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
    @Transactional
    public RentIncrease create(RentIncrease request) {
        RentIncrease saved = super.create(request);
        notifyTenant(saved, "Rent increase notice");
        return saved;
    }

    @Override
    @Transactional
    public RentIncrease update(UUID id, RentIncrease request) {
        RentIncrease saved = super.update(id, request);
        notifyTenant(saved, "Rent increase updated");
        notificationService.notifyOrganizationStaff(saved.getOrganizationId(), "Rent increase response updated",
                "Status: " + saved.getStatus() + ". Open Rent Increases for details.",
                "RENT_INCREASE_UPDATED", "/rent-increases");
        return saved;
    }

    private void notifyTenant(RentIncrease increase, String title) {
        if (increase.getStatus() == null || increase.getStatus() == com.rentsphere.entity.RentIncreaseStatus.DRAFT) return;
        String detail = "Rent changes from " + increase.getPreviousRent() + " to " + increase.getProposedRent()
                + (increase.getEffectiveDate() == null ? "" : " effective " + increase.getEffectiveDate())
                + ". Status: " + increase.getStatus() + ". Open Rent Increases to review.";
        notificationService.notifyTenant(increase.getTenantId(), title, detail, "RENT_INCREASE_ACTION", "/rent-increases");
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
