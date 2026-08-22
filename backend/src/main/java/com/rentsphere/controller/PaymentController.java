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
import com.rentsphere.dto.PaymentRequest;
import com.rentsphere.dto.PaymentResponse;
import com.rentsphere.service.PaymentService;
import com.rentsphere.service.InvoiceService;
import com.rentsphere.service.TenantService;
import com.rentsphere.service.UserService;
import com.rentsphere.entity.Tenant;
import com.rentsphere.entity.User;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.security.SecurityUtils;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
public class PaymentController {

    private final PaymentService paymentService;
    private final InvoiceService invoiceService;
    private final UserService userService;
    private final TenantService tenantService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('TENANT')")
    public List<PaymentResponse> getMyPayments() {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
        UUID tenantId = tenantService.findOrCreateForUser(user).getId();
        List<UUID> invoiceIds = invoiceService.findByTenantId(tenantId).stream()
                .map(invoice -> invoice.getId())
                .toList();
        return DtoMapper.toResponseList(paymentService.findByInvoiceIds(invoiceIds), DtoMapper::toResponse);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse createPayment(@Valid @RequestBody PaymentRequest request) {
        var entity = paymentService.create(DtoMapper.toEntity(request));
        return DtoMapper.toResponse(entity);
    }

    @GetMapping
    public List<PaymentResponse> getAllPayments() {
        return DtoMapper.toResponseList(paymentService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    public Page<PaymentResponse> getPagedPayments(@PageableDefault(size = 20) Pageable pageable) {
        return paymentService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    public PaymentResponse getPaymentById(@PathVariable UUID id) {
        return DtoMapper.toResponse(paymentService.findById(id));
    }

    @PutMapping("/{id}")
    public PaymentResponse updatePayment(@PathVariable UUID id, @Valid @RequestBody PaymentRequest request) {
        var entity = paymentService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(paymentService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePayment(@PathVariable UUID id) {
        paymentService.delete(id);
    }
}
