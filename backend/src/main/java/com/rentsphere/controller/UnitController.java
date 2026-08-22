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

import com.rentsphere.dto.DtoMapper;
import com.rentsphere.dto.UnitRequest;
import com.rentsphere.dto.UnitResponse;
import com.rentsphere.service.UnitService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/units")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UnitController {

    private final UnitService unitService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public UnitResponse createUnit(@Valid @RequestBody UnitRequest request) {
        var entity = unitService.create(DtoMapper.toEntity(request));
        return DtoMapper.toResponse(entity);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public List<UnitResponse> getAllUnits() {
        return DtoMapper.toResponseList(unitService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public Page<UnitResponse> getPagedUnits(@PageableDefault(size = 20) Pageable pageable) {
        return unitService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public UnitResponse getUnitById(@PathVariable UUID id) {
        return DtoMapper.toResponse(unitService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public UnitResponse updateUnit(@PathVariable UUID id, @Valid @RequestBody UnitRequest request) {
        var entity = unitService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(unitService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public void deleteUnit(@PathVariable UUID id) {
        unitService.delete(id);
    }
}
