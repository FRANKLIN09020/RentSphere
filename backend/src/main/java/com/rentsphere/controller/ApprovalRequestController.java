package com.rentsphere.controller;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.rentsphere.dto.ApprovalCreateRequest;
import com.rentsphere.dto.ApprovalDecisionRequest;
import com.rentsphere.dto.ApprovalRequestResponse;
import com.rentsphere.dto.DtoMapper;
import com.rentsphere.entity.ApprovalStatus;
import com.rentsphere.entity.UserRole;
import com.rentsphere.service.ApprovalRequestService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
public class ApprovalRequestController {

    private final ApprovalRequestService approvalRequestService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApprovalRequestResponse createApproval(@Valid @RequestBody ApprovalCreateRequest request) {
        return DtoMapper.toResponse(approvalRequestService.create(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public List<ApprovalRequestResponse> getApprovals(@RequestParam(required = false) ApprovalStatus status, Principal principal) {
        String currentEmail = principal.getName();
        UserRole currentRole = getCurrentRole();
        return DtoMapper.toResponseList(approvalRequestService.findAll(status, currentEmail, currentRole), DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public ApprovalRequestResponse getApprovalById(@PathVariable UUID id, Principal principal) {
        String currentEmail = principal.getName();
        UserRole currentRole = getCurrentRole();
        return DtoMapper.toResponse(approvalRequestService.findById(id, currentEmail, currentRole));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApprovalRequestResponse approve(@PathVariable UUID id, @RequestBody(required = false) ApprovalDecisionRequest request) {
        return DtoMapper.toResponse(approvalRequestService.approve(id, request));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApprovalRequestResponse reject(@PathVariable UUID id, @RequestBody(required = false) ApprovalDecisionRequest request) {
        return DtoMapper.toResponse(approvalRequestService.reject(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteApproval(@PathVariable UUID id) {
        approvalRequestService.delete(id);
    }

    private UserRole getCurrentRole() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(authority -> authority.replace("ROLE_", ""))
                .map(UserRole::valueOf)
                .findFirst()
                .orElse(UserRole.TENANT);
    }
}
