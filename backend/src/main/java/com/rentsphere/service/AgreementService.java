package com.rentsphere.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.rentsphere.entity.Agreement;
import com.rentsphere.repository.AgreementRepository;

@Service
public class AgreementService extends BaseCrudService<Agreement> {

    private final AgreementRepository agreementRepository;

    public AgreementService(AgreementRepository agreementRepository) {
        super(agreementRepository, "Agreement");
        this.agreementRepository = agreementRepository;
    }

    @Override
    public Page<Agreement> findAll(Pageable pageable) {
        return agreementRepository.findAllByOrderByCreatedAtDesc(pageable);
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
