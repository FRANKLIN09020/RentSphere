package com.rentsphere.service;

import org.springframework.stereotype.Service;

import com.rentsphere.entity.Organization;
import com.rentsphere.repository.OrganizationRepository;

@Service
public class OrganizationService extends BaseCrudService<Organization> {

    public OrganizationService(OrganizationRepository organizationRepository) {
        super(organizationRepository, "Organization");
    }

    @Override
    protected void applyUpdates(Organization entity, Organization request) {
        entity.setName(request.getName());
        entity.setAddress(request.getAddress());
        entity.setPhone(request.getPhone());
        entity.setEmail(request.getEmail());
    }
}
