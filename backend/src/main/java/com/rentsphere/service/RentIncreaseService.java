package com.rentsphere.service;

import org.springframework.stereotype.Service;

import com.rentsphere.entity.RentIncrease;
import com.rentsphere.repository.RentIncreaseRepository;

@Service
public class RentIncreaseService extends BaseCrudService<RentIncrease> {

    public RentIncreaseService(RentIncreaseRepository rentIncreaseRepository) {
        super(rentIncreaseRepository, "Rent increase");
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
        entity.setIncreaseAmount(request.getIncreaseAmount());
        entity.setIncreasePercent(request.getIncreasePercent());
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
