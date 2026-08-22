package com.rentsphere.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import com.rentsphere.entity.RentIncreaseStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentIncreaseRequest {
    private UUID organizationId;
    private UUID tenantId;
    private UUID unitId;
    private UUID agreementId;
    @NotNull
    private BigDecimal previousRent;
    @NotNull
    private BigDecimal proposedRent;
    private BigDecimal increaseAmount;
    private BigDecimal increasePercent;
    private LocalDate noticeDate;
    private LocalDate effectiveDate;
    private LocalDateTime notificationScheduledAt;
    private LocalDateTime notificationSentAt;
    private String reason;
    private String tenantResponse;
    private String ownerNotes;
    private RentIncreaseStatus status;
}
