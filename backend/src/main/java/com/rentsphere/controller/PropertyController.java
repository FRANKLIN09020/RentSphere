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
import com.rentsphere.dto.PropertyRequest;
import com.rentsphere.dto.PropertyResponse;
import com.rentsphere.service.PropertyService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/properties")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class PropertyController {

    private final PropertyService propertyService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public PropertyResponse createProperty(@Valid @RequestBody PropertyRequest request) {
        var entity = propertyService.create(DtoMapper.toEntity(request));
        return DtoMapper.toResponse(entity);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public List<PropertyResponse> getAllProperties() {
        return DtoMapper.toResponseList(propertyService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public Page<PropertyResponse> getPagedProperties(@PageableDefault(size = 20) Pageable pageable) {
        return propertyService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public PropertyResponse getPropertyById(@PathVariable UUID id) {
        return DtoMapper.toResponse(propertyService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public PropertyResponse updateProperty(@PathVariable UUID id, @Valid @RequestBody PropertyRequest request) {
        var entity = propertyService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(propertyService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public void deleteProperty(@PathVariable UUID id) {
        propertyService.delete(id);
    }
}
