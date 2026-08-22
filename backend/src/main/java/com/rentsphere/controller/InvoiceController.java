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
import com.rentsphere.dto.InvoiceRequest;
import com.rentsphere.dto.InvoiceResponse;
import com.rentsphere.entity.Tenant;
import com.rentsphere.entity.User;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.security.SecurityUtils;
import com.rentsphere.service.InvoiceService;
import com.rentsphere.service.TenantService;
import com.rentsphere.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final UserService userService;
    private final TenantService tenantService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('TENANT')")
    public List<InvoiceResponse> getMyInvoices() {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
        UUID tenantId = tenantService.findOrCreateForUser(user).getId();
        return DtoMapper.toResponseList(invoiceService.findByTenantId(tenantId), DtoMapper::toResponse);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceResponse createInvoice(@Valid @RequestBody InvoiceRequest request) {
        var entity = invoiceService.create(DtoMapper.toEntity(request));
        return DtoMapper.toResponse(entity);
    }

    @GetMapping
    public List<InvoiceResponse> getAllInvoices() {
        return DtoMapper.toResponseList(invoiceService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    public Page<InvoiceResponse> getPagedInvoices(@PageableDefault(size = 20) Pageable pageable) {
        return invoiceService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    public InvoiceResponse getInvoiceById(@PathVariable UUID id) {
        return DtoMapper.toResponse(invoiceService.findById(id));
    }

    @PutMapping("/{id}")
    public InvoiceResponse updateInvoice(@PathVariable UUID id, @Valid @RequestBody InvoiceRequest request) {
        var entity = invoiceService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(invoiceService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInvoice(@PathVariable UUID id) {
        invoiceService.delete(id);
    }
}
