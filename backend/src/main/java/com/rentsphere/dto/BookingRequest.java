package com.rentsphere.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingRequest {

    @NotNull
    private UUID propertyId;

    @NotNull
    private UUID unitId;

    @NotNull
    @FutureOrPresent
    private LocalDate visitDate;

    @NotNull
    private LocalTime visitTime;

    private String note;
}
