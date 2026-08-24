package com.rentsphere.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayCreateOrderResponse {
    private String orderId;
    private Long amount;
    private String currency;
    private String keyId;
    private boolean paymentCompleted;
}
