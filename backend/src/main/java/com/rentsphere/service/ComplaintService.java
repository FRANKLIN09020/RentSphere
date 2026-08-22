package com.rentsphere.service;

import org.springframework.stereotype.Service;

import com.rentsphere.entity.Complaint;
import com.rentsphere.repository.ComplaintRepository;

@Service
public class ComplaintService extends BaseCrudService<Complaint> {

    public ComplaintService(ComplaintRepository complaintRepository) {
        super(complaintRepository, "Complaint");
    }

    @Override
    protected void applyUpdates(Complaint entity, Complaint request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setUnitId(request.getUnitId());
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setStatus(request.getStatus());
    }
}
