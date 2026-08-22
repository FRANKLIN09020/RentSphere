package com.rentsphere.service;

import org.springframework.stereotype.Service;

import com.rentsphere.entity.Property;
import com.rentsphere.repository.PropertyRepository;

@Service
public class PropertyService extends BaseCrudService<Property> {

    public PropertyService(PropertyRepository propertyRepository) {
        super(propertyRepository, "Property");
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
