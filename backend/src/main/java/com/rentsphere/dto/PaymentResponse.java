package com.rentsphere.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import com.rentsphere.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private UUID id;
    private UUID organizationId;
    private UUID invoiceId;
    private BigDecimal amount;
    private PaymentStatus status;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
