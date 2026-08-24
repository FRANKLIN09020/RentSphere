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

import com.rentsphere.dto.DepositDisputeRequest;
import com.rentsphere.dto.DepositDisputeResponse;
import com.rentsphere.dto.DtoMapper;
import com.rentsphere.dto.SettlementAdviceResponse;
import com.rentsphere.security.SecurityUtils;
import com.rentsphere.service.AiInsightService;
import com.rentsphere.service.CurrentTenantService;
import com.rentsphere.service.DepositDisputeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/deposit-disputes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
public class DepositDisputeController {

    private final DepositDisputeService depositDisputeService;
    private final CurrentTenantService currentTenantService;
    private final AiInsightService aiInsightService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @ResponseStatus(HttpStatus.CREATED)
    public DepositDisputeResponse createDepositDispute(@Valid @RequestBody DepositDisputeRequest request) {
        var entity = DtoMapper.toEntity(request);
        return DtoMapper.toResponse(depositDisputeService.create(entity));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('TENANT')")
    public List<DepositDisputeResponse> getMyDepositDisputes() {
        return DtoMapper.toResponseList(depositDisputeService.findByTenantId(currentTenantService.getCurrentTenant().getId()), DtoMapper::toResponse);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public List<DepositDisputeResponse> getAllDepositDisputes() {
        return DtoMapper.toResponseList(depositDisputeService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public Page<DepositDisputeResponse> getPagedDepositDisputes(@PageableDefault(size = 20) Pageable pageable) {
        return depositDisputeService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public DepositDisputeResponse getDepositDisputeById(@PathVariable UUID id) {
        var dispute = depositDisputeService.findById(id);
        if (SecurityUtils.hasRole("TENANT")
                && !currentTenantService.getCurrentTenant().getId().equals(dispute.getTenantId())) {
            throw new AccessDeniedException("Access denied to this deposit dispute");
        }
        return DtoMapper.toResponse(dispute);
    }

    @GetMapping("/{id}/settlement-advice")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public SettlementAdviceResponse getSettlementAdvice(@PathVariable UUID id) {
        var dispute = depositDisputeService.findById(id);
        if (SecurityUtils.hasRole("TENANT")
                && !currentTenantService.getCurrentTenant().getId().equals(dispute.getTenantId())) {
            throw new AccessDeniedException("Access denied to this deposit dispute advice");
        }
        var advice = aiInsightService.recommendSettlement(
                dispute.getDepositAmount(),
                dispute.getDeductedAmount(),
                dispute.getOwnerRepairEstimate(),
                dispute.getMarketRepairEstimate(),
                dispute.getProposedSettlementAmount(),
                dispute.getDeductionReason());
        return new SettlementAdviceResponse(
                advice.recommendedDeduction(),
                advice.suggestedRefund(),
                advice.rationale(),
                advice.usedFallback(),
                advice.model());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public DepositDisputeResponse updateDepositDispute(@PathVariable UUID id, @Valid @RequestBody DepositDisputeRequest request) {
        var entity = depositDisputeService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(depositDisputeService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDepositDispute(@PathVariable UUID id) {
        depositDisputeService.delete(id);
    }
}
