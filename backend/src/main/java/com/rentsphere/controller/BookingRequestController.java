package com.rentsphere.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.rentsphere.dto.ApprovalRequestResponse;
import com.rentsphere.dto.DtoMapper;
import com.rentsphere.service.BookingRequestService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/booking-requests")
@RequiredArgsConstructor
public class BookingRequestController {

    private final BookingRequestService bookingRequestService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('TENANT','ADMIN','OWNER')")
    public List<ApprovalRequestResponse> createBookingRequest(@Valid @RequestBody com.rentsphere.dto.BookingRequest request, Principal principal) {
        return DtoMapper.toResponseList(bookingRequestService.create(principal.getName(), request), DtoMapper::toResponse);
    }
}
