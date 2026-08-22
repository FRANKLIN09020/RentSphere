package com.rentsphere.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.Tenant;
import com.rentsphere.entity.User;
import com.rentsphere.repository.TenantRepository;

@Service
public class TenantService extends BaseCrudService<Tenant> {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        super(tenantRepository, "Tenant");
        this.tenantRepository = tenantRepository;
    }

    public Optional<Tenant> findByUserId(UUID userId) {
        return tenantRepository.findByUserId(userId).stream().findFirst();
    }

    /**
     * Ensures every tenant login has the tenant profile required by invoice and
     * payment ownership checks. This also repairs accounts created before tenant
     * profiles were provisioned during registration.
     */
    @Transactional
    public Tenant findOrCreateForUser(User user) {
        return findByUserId(user.getId()).orElseGet(() -> tenantRepository.save(
                Tenant.builder()
                        .userId(user.getId())
                        .organizationId(user.getOrganizationId())
                        .fullName(user.getName())
                        .phone(user.getPhone())
                        .kycStatus("PENDING")
                        .build()
        ));
    }

    @Override
    @Transactional
    public Tenant create(Tenant request) {
        if (request.getUserId() != null) {
            Optional<Tenant> existing = findByUserId(request.getUserId());
            if (existing.isPresent()) {
                Tenant tenant = existing.get();
                applyUpdates(tenant, request);
                return tenantRepository.save(tenant);
            }
        }
        return super.create(request);
    }

    @Override
    protected void applyUpdates(Tenant entity, Tenant request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setUserId(request.getUserId());
        entity.setUnitId(request.getUnitId());
        entity.setFullName(request.getFullName());
        entity.setPhone(request.getPhone());
        entity.setEmergencyContact(request.getEmergencyContact());
        entity.setKycStatus(request.getKycStatus());
        entity.setIdProofUrl(request.getIdProofUrl());
        entity.setAddressProofUrl(request.getAddressProofUrl());
    }
}
