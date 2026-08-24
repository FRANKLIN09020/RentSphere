package com.rentsphere.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.rentsphere.service.AiInsightService.ComplaintTriage;
import com.rentsphere.service.AiInsightService.SettlementAdvice;

class AiInsightServiceTest {

    private final AiInsightService service = new AiInsightService();

    @Test
    void triageFallsBackToHeuristicsWithoutApiKey() {
        ComplaintTriage triage = service.triageComplaint(
                "Kitchen pipe burst",
                "Water is flooding the kitchen floor and will not stop.");

        assertTrue(triage.usedFallback());
        assertEquals("EMERGENCY", triage.priority());
        assertEquals("PLUMBING", triage.category());
    }

    @Test
    void triageClassifiesCosmeticIssuesAsLow() {
        ComplaintTriage triage = service.triageComplaint("Wall paint issue", "Minor cosmetic paint peeling near the window.");

        assertTrue(triage.usedFallback());
        assertEquals("LOW", triage.priority());
        assertEquals("STRUCTURAL", triage.category());
    }

    @Test
    void settlementHeuristicCapsDeductionAtMarketEstimate() {
        SettlementAdvice advice = service.heuristicSettlement(
                new BigDecimal("50000.00"),
                new BigDecimal("12000.00"),
                new BigDecimal("12000.00"),
                new BigDecimal("6500.00"),
                new BigDecimal("7000.00"));

        assertTrue(advice.usedFallback());
        assertEquals(new BigDecimal("6500.00"), advice.recommendedDeduction());
        assertEquals(new BigDecimal("43500.00"), advice.suggestedRefund());
    }

    @Test
    void settlementHeuristicNeverExceedsDeductedAmount() {
        SettlementAdvice advice = service.heuristicSettlement(
                new BigDecimal("50000.00"),
                new BigDecimal("4000.00"),
                new BigDecimal("12000.00"),
                new BigDecimal("6500.00"),
                BigDecimal.ZERO);

        assertEquals(new BigDecimal("4000.00"), advice.recommendedDeduction());
        assertEquals(new BigDecimal("46000.00"), advice.suggestedRefund());
    }

    @Test
    void settlementHeuristicUsesOwnerEstimateWhenMarketMissing() {
        SettlementAdvice advice = service.heuristicSettlement(
                new BigDecimal("30000.00"),
                new BigDecimal("8000.00"),
                new BigDecimal("7500.00"),
                null,
                BigDecimal.ZERO);

        assertEquals(new BigDecimal("7500.00"), advice.recommendedDeduction());
    }
}
