package com.rentsphere.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

import com.rentsphere.entity.DepositDispute;
import com.rentsphere.repository.DepositDisputeRepository;

@Service
public class DepositDisputeService extends BaseCrudService<DepositDispute> {
    private final DepositDisputeRepository depositDisputeRepository;
    private final NotificationService notificationService;

    public DepositDisputeService(DepositDisputeRepository depositDisputeRepository,
            NotificationService notificationService) {
        super(depositDisputeRepository, "Deposit dispute");
        this.depositDisputeRepository = depositDisputeRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<DepositDispute> findAll() {
        return findAllScoped(depositDisputeRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DepositDispute> findAll(Pageable pageable) {
        return findAllScoped(pageable, depositDisputeRepository::findByOrganizationId);
    }

    public List<DepositDispute> findByTenantId(UUID tenantId) {
        return depositDisputeRepository.findByTenantId(tenantId);
    }

    @Override
    public String getCacheName() {
        return "depositDisputes";
    }

    @Override
    @Transactional
    public DepositDispute create(DepositDispute request) {
        DepositDispute saved = super.create(request);
        notificationService.notifyOrganizationStaff(saved.getOrganizationId(), "New deposit dispute",
                "A deposit dispute is now " + saved.getStatus() + ".", "DISPUTE_CREATED", "/deposit-disputes");
        notificationService.notifyTenant(saved.getTenantId(), "Deposit dispute opened",
                "Your deposit dispute is now " + saved.getStatus() + ". Open Deposit Disputes for details.",
                "DISPUTE_ACTION", "/deposit-disputes");
        return saved;
    }

    @Override
    @Transactional
    public DepositDispute update(UUID id, DepositDispute request) {
        DepositDispute saved = super.update(id, request);
        notificationService.notifyTenant(saved.getTenantId(), "Deposit dispute updated",
                "Status: " + saved.getStatus() + (saved.getSettlementDueDate() == null ? "" : ". Respond by " + saved.getSettlementDueDate()),
                "DISPUTE_ACTION", "/deposit-disputes");
        return saved;
    }

    @Override
    protected void applyUpdates(DepositDispute entity, DepositDispute request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setUnitId(request.getUnitId());
        entity.setAgreementId(request.getAgreementId());
        entity.setDepositAmount(request.getDepositAmount());
        entity.setDeductedAmount(request.getDeductedAmount());
        entity.setOwnerRepairEstimate(request.getOwnerRepairEstimate());
        entity.setMarketRepairEstimate(request.getMarketRepairEstimate());
        entity.setProposedSettlementAmount(request.getProposedSettlementAmount());
        entity.setDeductionReason(request.getDeductionReason());
        entity.setEvidenceUrl(request.getEvidenceUrl());
        entity.setTenantNotes(request.getTenantNotes());
        entity.setOwnerResponse(request.getOwnerResponse());
        entity.setSettlementDueDate(request.getSettlementDueDate());
        entity.setStatus(request.getStatus());
    }
}
