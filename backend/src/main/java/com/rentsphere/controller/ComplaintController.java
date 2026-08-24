package com.rentsphere.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.rentsphere.dto.ComplaintRequest;
import com.rentsphere.dto.ComplaintResponse;
import com.rentsphere.dto.DtoMapper;
import com.rentsphere.entity.ComplaintStatus;
import com.rentsphere.service.ComplaintService;
import com.rentsphere.service.CurrentTenantService;
import com.rentsphere.security.SecurityUtils;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final CurrentTenantService currentTenantService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ComplaintResponse createComplaint(@Valid @RequestBody ComplaintRequest request) {
        var entity = DtoMapper.toEntity(request);
        if (SecurityUtils.hasRole("TENANT")) {
            var tenant = currentTenantService.getCurrentTenant();
            entity.setOrganizationId(tenant.getOrganizationId());
            entity.setTenantId(tenant.getId());
            entity.setUnitId(tenant.getUnitId());
            entity.setStatus(ComplaintStatus.OPEN);
        }
        return DtoMapper.toResponse(complaintService.create(entity));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('TENANT')")
    public List<ComplaintResponse> getMyComplaints() {
        return DtoMapper.toResponseList(complaintService.findByTenantId(currentTenantService.getCurrentTenant().getId()), DtoMapper::toResponse);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public List<ComplaintResponse> getAllComplaints() {
        return DtoMapper.toResponseList(complaintService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public Page<ComplaintResponse> getPagedComplaints(@PageableDefault(size = 20) Pageable pageable) {
        return complaintService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public ComplaintResponse getComplaintById(@PathVariable UUID id) {
        var complaint = complaintService.findById(id);
        if (SecurityUtils.hasRole("TENANT")
                && !currentTenantService.getCurrentTenant().getId().equals(complaint.getTenantId())) {
            throw new AccessDeniedException("Access denied to this complaint");
        }
        return DtoMapper.toResponse(complaint);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ComplaintResponse updateComplaint(@PathVariable UUID id, @Valid @RequestBody ComplaintRequest request) {
        var entity = complaintService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(complaintService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComplaint(@PathVariable UUID id) {
        complaintService.delete(id);
    }
}
