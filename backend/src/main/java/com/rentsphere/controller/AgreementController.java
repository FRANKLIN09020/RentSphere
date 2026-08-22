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

import com.rentsphere.dto.AgreementRequest;
import com.rentsphere.dto.AgreementResponse;
import com.rentsphere.dto.DtoMapper;
import com.rentsphere.service.AgreementService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/agreements")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
public class AgreementController {

    private final AgreementService agreementService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AgreementResponse createAgreement(@Valid @RequestBody AgreementRequest request) {
        var entity = agreementService.create(DtoMapper.toEntity(request));
        return DtoMapper.toResponse(entity);
    }

    @GetMapping
    public List<AgreementResponse> getAllAgreements() {
        return DtoMapper.toResponseList(agreementService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    public Page<AgreementResponse> getPagedAgreements(@PageableDefault(size = 20) Pageable pageable) {
        return agreementService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    public AgreementResponse getAgreementById(@PathVariable UUID id) {
        return DtoMapper.toResponse(agreementService.findById(id));
    }

    @PutMapping("/{id}")
    public AgreementResponse updateAgreement(@PathVariable UUID id, @Valid @RequestBody AgreementRequest request) {
        var entity = agreementService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(agreementService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAgreement(@PathVariable UUID id) {
        agreementService.delete(id);
    }
}
