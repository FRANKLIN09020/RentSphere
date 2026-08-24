package com.rentsphere.service;

import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.Building;
import com.rentsphere.repository.BuildingRepository;
import com.rentsphere.security.SecurityUtils;

@Service
public class BuildingService extends BaseCrudService<Building> {

    private final BuildingRepository buildingRepository;

    public BuildingService(BuildingRepository buildingRepository) {
        super(buildingRepository, "Building");
        this.buildingRepository = buildingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<Building> findAll() {
        if (SecurityUtils.isTenant()) {
            return buildingRepository.findAll();
        }
        return findAllScoped(buildingRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Building> findAll(Pageable pageable) {
        if (SecurityUtils.isTenant()) {
            return buildingRepository.findAll(pageable);
        }
        return findAllScoped(pageable, buildingRepository::findByOrganizationId);
    }

    @Override
    protected void applyUpdates(Building entity, Building request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setPropertyId(request.getPropertyId());
        entity.setName(request.getName());
        entity.setFloors(request.getFloors());
        entity.setImageUrl(request.getImageUrl());
    }
}
