package com.rentsphere.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.Tenant;
import com.rentsphere.entity.User;
import com.rentsphere.repository.TenantRepository;
import com.rentsphere.repository.UserRepository;

@Service
public class TenantService extends BaseCrudService<Tenant> {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TenantService(TenantRepository tenantRepository, UserRepository userRepository,
            NotificationService notificationService) {
        super(tenantRepository, "Tenant");
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<Tenant> findAll() {
        return findAllScoped(tenantRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Tenant> findAll(Pageable pageable) {
        return findAllScoped(pageable, tenantRepository::findByOrganizationId);
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
    @Transactional
    @CacheEvict(cacheNames = "tenants", allEntries = true)
    public Tenant update(UUID id, Tenant request) {
        Tenant existing = findById(id);
        boolean becameVerified = !"VERIFIED".equalsIgnoreCase(existing.getKycStatus())
                && "VERIFIED".equalsIgnoreCase(request.getKycStatus());
        Tenant saved = super.update(id, request);
        if (becameVerified && saved.getUserId() != null) {
            userRepository.findById(saved.getUserId()).ifPresent(user -> notificationService.notifyUser(
                    saved.getOrganizationId(),
                    user.getEmail(),
                    "KYC verified",
                    "Your KYC is verified. Your owner can now activate the rental agreement; payment will appear when the invoice is ready.",
                    "KYC_VERIFIED",
                    "/approvals"));
        }
        return saved;
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
