package com.rentsphere.service;

import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.Property;
import com.rentsphere.repository.PropertyRepository;
import com.rentsphere.security.SecurityUtils;

@Service
public class PropertyService extends BaseCrudService<Property> {

    private final PropertyRepository propertyRepository;

    public PropertyService(PropertyRepository propertyRepository) {
        super(propertyRepository, "Property");
        this.propertyRepository = propertyRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<Property> findAll() {
        if (SecurityUtils.isTenant()) {
            return propertyRepository.findAll();
        }
        return findAllScoped(propertyRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Property> findAll(Pageable pageable) {
        if (SecurityUtils.isTenant()) {
            return propertyRepository.findAll(pageable);
        }
        return findAllScoped(pageable, propertyRepository::findByOrganizationId);
    }

    @Override
    protected void applyUpdates(Property entity, Property request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setOwnerId(request.getOwnerId());
        entity.setName(request.getName());
        entity.setAddress(request.getAddress());
        entity.setCity(request.getCity());
        entity.setState(request.getState());
        entity.setAmenities(request.getAmenities());
        entity.setImageUrl(request.getImageUrl());
    }
}
