package com.rentsphere.service;

import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.Unit;
import com.rentsphere.repository.UnitRepository;
import com.rentsphere.security.SecurityUtils;

@Service
public class UnitService extends BaseCrudService<Unit> {

    private final UnitRepository unitRepository;

    public UnitService(UnitRepository unitRepository) {
        super(unitRepository, "Unit");
        this.unitRepository = unitRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<Unit> findAll() {
        if (SecurityUtils.isTenant()) {
            return unitRepository.findAll();
        }
        return findAllScoped(unitRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Unit> findAll(Pageable pageable) {
        if (SecurityUtils.isTenant()) {
            return unitRepository.findAll(pageable);
        }
        return findAllScoped(pageable, unitRepository::findByOrganizationId);
    }

    @Override
    protected void applyUpdates(Unit entity, Unit request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setBuildingId(request.getBuildingId());
        entity.setUnitNumber(request.getUnitNumber());
        entity.setRentAmount(request.getRentAmount());
        entity.setStatus(request.getStatus());
    }
}
