package com.rentsphere.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.rentsphere.dto.BuildingRequest;
import com.rentsphere.dto.BuildingResponse;
import com.rentsphere.dto.DtoMapper;
import com.rentsphere.service.BuildingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/buildings")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class BuildingController {

    private final BuildingService buildingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public BuildingResponse createBuilding(@Valid @RequestBody BuildingRequest request) {
        var entity = buildingService.create(DtoMapper.toEntity(request));
        return DtoMapper.toResponse(entity);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public List<BuildingResponse> getAllBuildings() {
        return DtoMapper.toResponseList(buildingService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public Page<BuildingResponse> getPagedBuildings(@PageableDefault(size = 20) Pageable pageable) {
        return buildingService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public BuildingResponse getBuildingById(@PathVariable UUID id) {
        return DtoMapper.toResponse(buildingService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public BuildingResponse updateBuilding(@PathVariable UUID id, @Valid @RequestBody BuildingRequest request) {
        var entity = buildingService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(buildingService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public void deleteBuilding(@PathVariable UUID id) {
        buildingService.delete(id);
    }
}
