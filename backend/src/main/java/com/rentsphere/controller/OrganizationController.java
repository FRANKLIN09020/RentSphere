package com.rentsphere.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

import com.rentsphere.entity.Organization;
import com.rentsphere.service.OrganizationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/organizations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Organization createOrganization(@Valid @RequestBody Organization organization) {
        return organizationService.create(organization);
    }

    @GetMapping
    public List<Organization> getAllOrganizations() {
        return organizationService.findAll();
    }

    @GetMapping("/paged")
    public Page<Organization> getPagedOrganizations(@PageableDefault(size = 20) Pageable pageable) {
        return organizationService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public Organization getOrganizationById(@PathVariable UUID id) {
        return organizationService.findById(id);
    }

    @PutMapping("/{id}")
    public Organization updateOrganization(@PathVariable UUID id, @Valid @RequestBody Organization request) {
        return organizationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteOrganization(@PathVariable UUID id) {
        organizationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
