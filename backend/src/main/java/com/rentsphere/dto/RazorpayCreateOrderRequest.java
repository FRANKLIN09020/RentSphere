package com.rentsphere.dto;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayCreateOrderRequest {
    @NotNull
    private UUID invoiceId;

    @NotNull
    private BigDecimal amount;
}
