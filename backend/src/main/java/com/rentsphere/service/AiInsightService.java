package com.rentsphere.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Llama-powered insights (via the Groq OpenAI-compatible API) for complaint
 * triage and deposit-dispute settlement guidance. Every method degrades to a
 * deterministic local heuristic when the API key is missing or the call fails,
 * so workflows never block on the AI provider.
 */
@Service
public class AiInsightService {
    private static final Logger logger = LoggerFactory.getLogger(AiInsightService.class);

    private static final List<String> PRIORITIES = List.of("EMERGENCY", "HIGH", "MEDIUM", "LOW");
    private static final List<String> CATEGORIES = List.of(
            "PLUMBING", "ELECTRICAL", "STRUCTURAL", "APPLIANCE", "PEST", "SECURITY", "CLEANING", "OTHER");

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.ai.groq.api-key:}")
    private String apiKey;

    @Value("${app.ai.groq.model:openai/gpt-oss-20b}")
    private String model;

    public AiInsightService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.groq.com/openai/v1")
                .build();
    }

    public record ComplaintTriage(String priority, String category, String note, boolean usedFallback) {
    }

    public record SettlementAdvice(
            BigDecimal recommendedDeduction,
            BigDecimal suggestedRefund,
            String rationale,
            boolean usedFallback,
            String model) {
    }

    public ComplaintTriage triageComplaint(String title, String description) {
        String text = (title == null ? "" : title + " ") + (description == null ? "" : description);
        if (apiKey == null || apiKey.isBlank() || !apiKey.startsWith("gsk_")) {
            return heuristicTriage(text);
        }

        try {
            String prompt = "You triage property maintenance complaints for a rental management platform. " +
                    "Classify the complaint and reply with ONLY a JSON object, no markdown, in this exact shape: " +
                    "{\"priority\":\"EMERGENCY|HIGH|MEDIUM|LOW\",\"category\":\"PLUMBING|ELECTRICAL|STRUCTURAL|APPLIANCE|PEST|SECURITY|CLEANING|OTHER\",\"note\":\"one short sentence explaining the urgency\"}. " +
                    "EMERGENCY means active water flooding, fire, gas smell, exposed wiring or an uninhabitable safety hazard. " +
                    "HIGH means a essential system is unusable (no water, no power, broken main-door lock, no cooling in extreme heat). " +
                    "MEDIUM means inconvenient but livable. LOW means cosmetic or minor.\n\n" +
                    "Complaint title: " + (title == null ? "" : title) + "\n" +
                    "Complaint description: " + (description == null ? "" : description);

            String content = chat(prompt);
            JsonNode node = objectMapper.readTree(extractJson(content));
            String priority = normalize(node.path("priority").asText(""), PRIORITIES, "MEDIUM");
            String category = normalize(node.path("category").asText(""), CATEGORIES, "OTHER");
            String note = node.path("note").asText("");
            if (note.isBlank()) {
                note = "Classified by " + model + ".";
            }
            return new ComplaintTriage(priority, category, trim(note), false);
        } catch (Exception ex) {
            logger.warn("AI complaint triage failed, using heuristic fallback: {}", ex.getMessage());
            return heuristicTriage(text);
        }
    }

    public SettlementAdvice recommendSettlement(
            BigDecimal depositAmount,
            BigDecimal deductedAmount,
            BigDecimal ownerRepairEstimate,
            BigDecimal marketRepairEstimate,
            BigDecimal proposedSettlementAmount,
            String deductionReason) {
        SettlementAdvice fallback = heuristicSettlement(
                depositAmount, deductedAmount, ownerRepairEstimate, marketRepairEstimate, proposedSettlementAmount);
        if (apiKey == null || apiKey.isBlank() || !apiKey.startsWith("gsk_")) {
            return fallback;
        }

        try {
            String prompt = "You advise property managers on fair tenant deposit-dispute settlements ( amounts in INR ). " +
                    "Reply with ONLY a JSON object, no markdown: " +
                    "{\"recommendedDeduction\":number,\"rationale\":\"2-3 sentences comparing the owner and market repair estimates and justifying the deduction\"}. " +
                    "The recommendedDeduction is the amount withheld from the tenant's deposit for repairs. Be fair to both sides: " +
                    "do not blindly accept inflated owner estimates; weight independent market estimates heavily; never exceed the deducted amount.\n\n" +
                    "Deposit amount: " + money(depositAmount) + "\n" +
                    "Amount deducted by owner: " + money(deductedAmount) + "\n" +
                    "Owner repair estimate: " + money(ownerRepairEstimate) + "\n" +
                    "Independent market repair estimate: " + money(marketRepairEstimate) + "\n" +
                    "Settlement already proposed: " + money(proposedSettlementAmount) + "\n" +
                    "Stated deduction reason: " + (deductionReason == null || deductionReason.isBlank() ? "not provided" : deductionReason);

            String content = chat(prompt);
            JsonNode node = objectMapper.readTree(extractJson(content));
            BigDecimal recommended = new BigDecimal(node.path("recommendedDeduction").asText("0"));
            recommended = clampDeduction(recommended, depositAmount, deductedAmount);
            String rationale = node.path("rationale").asText("");
            if (rationale.isBlank()) {
                rationale = fallback.rationale();
            }
            return new SettlementAdvice(
                    recommended,
                    refundFor(depositAmount, recommended),
                    trim(rationale),
                    false,
                    model);
        } catch (Exception ex) {
            logger.warn("AI settlement advice failed, using heuristic fallback: {}", ex.getMessage());
            return fallback;
        }
    }

    private String chat(String prompt) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "temperature", 0.1,
                "max_tokens", 512,
                "response_format", Map.of("type", "json_object"));

        Map<String, Object> response = restClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header("Authorization", "Bearer " + apiKey)
                .body(body)
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        Map<String, Object> firstChoice = choices != null && !choices.isEmpty() ? choices.get(0) : Map.of();
        Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
        return message != null ? String.valueOf(message.get("content")) : "";
    }

    ComplaintTriage heuristicTriage(String text) {
        String normalized = text == null ? "" : text.toLowerCase();

        String category = "OTHER";
        if (containsAny(normalized, "leak", "flood", "tap", "flush", "drain", "water", "pipe", "toilet", "bathroom")) {
            category = "PLUMBING";
        } else if (containsAny(normalized, "light", "power", "electric", "wiring", "switch", "socket", "fan", "ac ", "air condition")) {
            category = "ELECTRICAL";
        } else if (containsAny(normalized, "wall", "crack", "ceiling", "roof", "door", "window", "floor")) {
            category = "STRUCTURAL";
        } else if (containsAny(normalized, "fridge", "refrigerator", "oven", "stove", "washing", "microwave", "geyser")) {
            category = "APPLIANCE";
        } else if (containsAny(normalized, "pest", "cockroach", "rat", "mosquito", "termite", "ant")) {
            category = "PEST";
        } else if (containsAny(normalized, "lock", "theft", "security", "break-in", "unsafe")) {
            category = "SECURITY";
        } else if (containsAny(normalized, "clean", "garbage", "dust", "smell")) {
            category = "CLEANING";
        }

        String priority = "MEDIUM";
        if (containsAny(normalized, "flood", "fire", "gas smell", "smoke", "spark", "shock", "exposed wire", "collapse", "sewage", "burst pipe")) {
            priority = "EMERGENCY";
        } else if (containsAny(normalized, "no water", "no power", "not working", "broken", "leak", "locked out", "cannot lock", "stuck")) {
            priority = "HIGH";
        } else if (containsAny(normalized, "slow", "minor", "cosmetic", "paint", "squeak", "noise", "occasional")) {
            priority = "LOW";
        }

        String note = "Rule-based triage: matched '" + category.toLowerCase() + "' signals with '" + priority.toLowerCase()
                + "' urgency keywords.";
        return new ComplaintTriage(priority, category, note, true);
    }

    SettlementAdvice heuristicSettlement(
            BigDecimal depositAmount,
            BigDecimal deductedAmount,
            BigDecimal ownerRepairEstimate,
            BigDecimal marketRepairEstimate,
            BigDecimal proposedSettlementAmount) {
        BigDecimal deposit = nonNegative(depositAmount);
        BigDecimal deducted = nonNegative(deductedAmount);
        BigDecimal owner = nonNegative(ownerRepairEstimate);
        BigDecimal market = nonNegative(marketRepairEstimate);
        BigDecimal proposed = nonNegative(proposedSettlementAmount);

        BigDecimal baseline;
        if (market.signum() > 0 && owner.signum() > 0) {
            baseline = market.min(owner);
        } else if (market.signum() > 0) {
            baseline = market;
        } else if (owner.signum() > 0) {
            baseline = owner;
        } else if (proposed.signum() > 0) {
            baseline = proposed;
        } else {
            baseline = deducted;
        }

        BigDecimal recommended = deducted.signum() > 0 ? deducted.min(baseline) : baseline;
        if (deposit.signum() > 0) {
            recommended = recommended.min(deposit);
        }
        recommended = recommended.setScale(2, RoundingMode.HALF_UP);

        String rationale = "Heuristic guidance (AI provider unavailable): the fair deduction is capped at the lower of the "
                + "owner and independent market repair estimates, and never exceeds the amount actually deducted. "
                + "Estimated fair deduction is " + recommended.toPlainString() + ", refunding the tenant "
                + refundFor(deposit, recommended).toPlainString() + " of the deposit.";
        return new SettlementAdvice(recommended, refundFor(deposit, recommended), rationale, true, "heuristic");
    }

    private BigDecimal refundFor(BigDecimal depositAmount, BigDecimal deduction) {
        BigDecimal deposit = nonNegative(depositAmount);
        BigDecimal cappedDeduction = deduction.min(deposit);
        return deposit.subtract(cappedDeduction).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal clampDeduction(BigDecimal value, BigDecimal depositAmount, BigDecimal deductedAmount) {
        BigDecimal result = value.max(BigDecimal.ZERO);
        if (deductedAmount != null && deductedAmount.signum() > 0) {
            result = result.min(deductedAmount);
        }
        if (depositAmount != null && depositAmount.signum() > 0) {
            result = result.min(depositAmount);
        }
        return result.setScale(2, RoundingMode.HALF_UP);
    }

    private String extractJson(String content) {
        if (content == null) {
            return "{}";
        }
        String cleaned = content.replace("```json", "").replace("```", "").trim();
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return cleaned.substring(start, end + 1);
        }
        return cleaned;
    }

    private String normalize(String value, List<String> allowed, String defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        String upper = value.trim().toUpperCase();
        return allowed.contains(upper) ? upper : defaultValue;
    }

    private String trim(String value) {
        String result = value == null ? "" : value.trim();
        return result.length() > 240 ? result.substring(0, 237) + "..." : result;
    }

    private String money(BigDecimal value) {
        return value == null ? "not provided" : value.toPlainString();
    }

    private BigDecimal nonNegative(BigDecimal value) {
        if (value == null || value.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return value;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
