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
import com.rentsphere.dto.RentIncreaseRequest;
import com.rentsphere.dto.RentIncreaseResponse;
import com.rentsphere.service.RentIncreaseService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/rent-increases")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
public class RentIncreaseController {

    private final RentIncreaseService rentIncreaseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @ResponseStatus(HttpStatus.CREATED)
    public RentIncreaseResponse createRentIncrease(@Valid @RequestBody RentIncreaseRequest request) {
        var entity = rentIncreaseService.create(DtoMapper.toEntity(request));
        return DtoMapper.toResponse(entity);
    }

    @GetMapping
    public List<RentIncreaseResponse> getAllRentIncreases() {
        return DtoMapper.toResponseList(rentIncreaseService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    public Page<RentIncreaseResponse> getPagedRentIncreases(@PageableDefault(size = 20) Pageable pageable) {
        return rentIncreaseService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    public RentIncreaseResponse getRentIncreaseById(@PathVariable UUID id) {
        return DtoMapper.toResponse(rentIncreaseService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','TENANT')")
    public RentIncreaseResponse updateRentIncrease(@PathVariable UUID id, @Valid @RequestBody RentIncreaseRequest request) {
        var entity = rentIncreaseService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(rentIncreaseService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRentIncrease(@PathVariable UUID id) {
        rentIncreaseService.delete(id);
    }
}
