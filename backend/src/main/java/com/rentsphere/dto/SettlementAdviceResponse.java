package com.rentsphere.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementAdviceResponse {
    private BigDecimal recommendedDeduction;
    private BigDecimal suggestedRefund;
    private String rationale;
    private boolean usedFallback;
    private String model;
}
