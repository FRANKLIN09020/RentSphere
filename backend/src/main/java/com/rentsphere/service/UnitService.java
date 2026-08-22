package com.rentsphere.service;

import org.springframework.stereotype.Service;

import com.rentsphere.entity.Unit;
import com.rentsphere.repository.UnitRepository;

@Service
public class UnitService extends BaseCrudService<Unit> {

    public UnitService(UnitRepository unitRepository) {
        super(unitRepository, "Unit");
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
