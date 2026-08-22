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
import com.rentsphere.dto.TenantRequest;
import com.rentsphere.dto.TenantResponse;
import com.rentsphere.entity.User;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.security.SecurityUtils;
import com.rentsphere.service.TenantService;
import com.rentsphere.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
public class TenantController {

    private final TenantService tenantService;
    private final UserService userService;

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public TenantResponse getMyTenant() {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
        return DtoMapper.toResponse(tenantService.findOrCreateForUser(user));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TenantResponse createTenant(@Valid @RequestBody TenantRequest request) {
        var entity = tenantService.create(DtoMapper.toEntity(request));
        return DtoMapper.toResponse(entity);
    }

    @GetMapping
    public List<TenantResponse> getAllTenants() {
        return DtoMapper.toResponseList(tenantService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    public Page<TenantResponse> getPagedTenants(@PageableDefault(size = 20) Pageable pageable) {
        return tenantService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    public TenantResponse getTenantById(@PathVariable UUID id) {
        return DtoMapper.toResponse(tenantService.findById(id));
    }

    @PutMapping("/{id}")
    public TenantResponse updateTenant(@PathVariable UUID id, @Valid @RequestBody TenantRequest request) {
        var entity = tenantService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(tenantService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTenant(@PathVariable UUID id) {
        tenantService.delete(id);
    }
}
