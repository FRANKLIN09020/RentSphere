package com.rentsphere.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import com.rentsphere.entity.InvoiceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {
    private UUID organizationId;
    private UUID tenantId;
    private UUID agreementId;
    @NotNull
    private BigDecimal amount;
    private LocalDate dueDate;
    private InvoiceStatus status;
}
