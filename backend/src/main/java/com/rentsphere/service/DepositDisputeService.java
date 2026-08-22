package com.rentsphere.service;

import org.springframework.stereotype.Service;

import com.rentsphere.entity.DepositDispute;
import com.rentsphere.repository.DepositDisputeRepository;

@Service
public class DepositDisputeService extends BaseCrudService<DepositDispute> {

    public DepositDisputeService(DepositDisputeRepository depositDisputeRepository) {
        super(depositDisputeRepository, "Deposit dispute");
    }

    @Override
    public String getCacheName() {
        return "depositDisputes";
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
