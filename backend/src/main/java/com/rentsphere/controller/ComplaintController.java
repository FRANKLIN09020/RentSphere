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

import com.rentsphere.dto.ComplaintRequest;
import com.rentsphere.dto.ComplaintResponse;
import com.rentsphere.dto.DtoMapper;
import com.rentsphere.service.ComplaintService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ComplaintResponse createComplaint(@Valid @RequestBody ComplaintRequest request) {
        var entity = complaintService.create(DtoMapper.toEntity(request));
        return DtoMapper.toResponse(entity);
    }

    @GetMapping
    public List<ComplaintResponse> getAllComplaints() {
        return DtoMapper.toResponseList(complaintService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    public Page<ComplaintResponse> getPagedComplaints(@PageableDefault(size = 20) Pageable pageable) {
        return complaintService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    public ComplaintResponse getComplaintById(@PathVariable UUID id) {
        return DtoMapper.toResponse(complaintService.findById(id));
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
