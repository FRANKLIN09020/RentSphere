package com.rentsphere.service;

import org.springframework.stereotype.Service;

import com.rentsphere.entity.Building;
import com.rentsphere.repository.BuildingRepository;

@Service
public class BuildingService extends BaseCrudService<Building> {

    public BuildingService(BuildingRepository buildingRepository) {
        super(buildingRepository, "Building");
    }

    @Override
    protected void applyUpdates(Building entity, Building request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setPropertyId(request.getPropertyId());
        entity.setName(request.getName());
        entity.setFloors(request.getFloors());
    }
}
