package com.rentsphere.service;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.rentsphere.dto.AiAssistantRequest;
import com.rentsphere.dto.AiAssistantResponse;

@Service
public class GeminiAssistantService {
    private static final Logger logger = LoggerFactory.getLogger(GeminiAssistantService.class);


    private final RestClient restClient;

    @Value("${app.ai.groq.api-key:}")
    private String apiKey;

    @Value("${app.ai.groq.model:openai/gpt-oss-20b}")
    private String model;

    public GeminiAssistantService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.groq.com/openai/v1")
                .build();
    }

    public AiAssistantResponse generateReply(AiAssistantRequest request, String personalContext) {
        String personalDataReply = buildPersonalFinanceReply(request, personalContext);
        if (personalDataReply != null) {
            return new AiAssistantResponse(personalDataReply, false, "rentsphere-records");
        }

        if (apiKey == null || apiKey.isBlank()) {
            return new AiAssistantResponse(
                    "AI API key is not configured yet. Please set app.ai.groq.api-key in the backend environment.",
                    true,
                    model);
        }

        if (!apiKey.startsWith("gsk_")) {
            return new AiAssistantResponse(
                    "The configured Groq API key format does not look valid. Please verify the key value.",
                    true,
                    model);
        }

        try {
            Map<String, Object> body = Map.of(
                    "model", model,
                    "messages", List.of(Map.of(
                            "role", "user",
                            "content", buildPrompt(request, personalContext))),
                    "temperature", 0.3,
                    "max_tokens", 1024);

            Map<String, Object> response = restClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> firstChoice = choices != null && !choices.isEmpty() ? choices.get(0)
                    : Map.of();
            Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
            String reply = message != null ? String.valueOf(message.get("content"))
                    : "I could not generate a reply.";

            return new AiAssistantResponse(reply, false, model);
        } catch (Exception ex) {
            logger.error("Groq API call failed", ex);
            return buildFallbackReply(request, ex.getMessage());
        }
    }

    private String buildPersonalFinanceReply(AiAssistantRequest request, String personalContext) {
        String message = request.message() == null ? "" : request.message().toLowerCase();
        boolean asksForOwnData = message.matches(".*\\b(my|current|invoice|invoices|amount due|outstanding)\\b.*")
                && message.matches(".*\\b(rent|invoice|invoices|payment|due)\\b.*");
        if (!asksForOwnData) return null;

        String context = personalContext == null ? "" : personalContext;
        Matcher agreement = Pattern.compile("Agreements:\\R - status ([^|\\r\\n]+).*?\\| rent ([^\\r\\n]+)")
                .matcher(context);
        Matcher invoiceSection = Pattern.compile("Invoices:\\R([\\s\\S]*?)(?:Payments:|Complaints:|Rent increases:|Deposit disputes:|Booking/visit requests|$)")
                .matcher(context);

        StringBuilder reply = new StringBuilder();
        if (agreement.find()) {
            reply.append("Your current agreement rent is ₹")
                    .append(agreement.group(2).trim())
                    .append(" and the agreement status is ")
                    .append(agreement.group(1).trim()).append(".");
        }

        if (invoiceSection.find()) {
            Matcher invoices = Pattern.compile(" - amount ([^|\\r\\n]+) \\| due ([^|\\r\\n]+) \\| status ([^\\r\\n]+)")
                    .matcher(invoiceSection.group(1));
            while (invoices.find()) {
                if (!reply.isEmpty()) reply.append(" ");
                reply.append("Invoice: ₹").append(invoices.group(1).trim())
                        .append(", due ").append(invoices.group(2).trim())
                        .append(", status ").append(invoices.group(3).trim()).append(".");
            }
        }

        if (!reply.isEmpty()) return reply.toString();
        if (context.contains("Tenant profile:")) {
            return "Your tenant profile is available, but no unit, rental agreement, or invoice is currently linked to your account. Please ask the administrator to assign your approved unit and create the agreement.";
        }
        return "No tenant profile, rental agreement, or invoice is currently linked to your login.";
    }

    AiAssistantResponse buildFallbackReply(AiAssistantRequest request, String errorDetail) {
        String normalizedMessage = request.message() == null ? "" : request.message().toLowerCase();
        String contextHint = (request.context() == null || request.context().isBlank())
                ? ""
                : " I also see that you attached knowledge context, so Iâ€™m using that as the main reference. ";
        String reason = explainFailure(errorDetail);
        String fallbackReply = "Iâ€™m currently using the built-in rental guidance because the online AI service is temporarily unavailable. " +
                contextHint +
                "Reason: " + reason + " " +
                "For a quick answer: " +
                suggestReply(normalizedMessage) +
                " If you need a policy-specific answer, please contact the property admin or refer to your lease documents.";

        return new AiAssistantResponse(fallbackReply, true, model);
    }

    private String explainFailure(String errorDetail) {
        if (errorDetail == null) {
            return "The service is unavailable right now.";
        }
        String normalized = errorDetail.toLowerCase();
        if (normalized.contains("quota") || normalized.contains("rate limit") || normalized.contains("resource_exhausted")) {
            return "The AI provider quota has been exhausted.";
        }
        if (normalized.contains("401") || normalized.contains("403") || normalized.contains("api key")) {
            return "The AI API key or permissions are invalid.";
        }
        if (normalized.contains("404")) {
            return "The selected AI model is not available for this account.";
        }
        return "The service is unavailable right now.";
    }

    private String suggestReply(String message) {
        if (message.contains("notice") || message.contains("vacat") || message.contains("leave")) {
            return "Most leases require written notice before moving out, and the exact notice period is usually stated in the lease agreement.";
        }
        if (message.contains("rent") || message.contains("payment") || message.contains("deposit")) {
            return "Rent and deposit issues are typically handled according to the lease terms and the propertyâ€™s payment policy.";
        }
        if (message.contains("maintenance") || message.contains("repair") || message.contains("complaint")) {
            return "Maintenance and complaint requests should be reported to the property manager with as much detail as possible.";
        }
        return "Please share the rental issue you need help with, and Iâ€™ll guide you through the next practical step.";
    }

    private String buildPrompt(AiAssistantRequest request, String personalContext) {
        return "You are RentSphere Assistant, a helpful rental and property management assistant. " +
                "Answer the user's request clearly and briefly. " +
                "If the user asks about their own account, profile, booked properties, agreements, invoices, payments, " +
                "complaints, rent increases, deposit disputes, or booking/approval requests, answer ONLY using the " +
                "PERSONAL DATA section below. Never invent information that is not listed there; if something is missing, " +
                "say it is not available. " +
                "If the question is about leasing, rent, deposits, maintenance, complaints, notices, or property visits in general, " +
                "provide a practical answer and, where relevant, reference the user's own data. " +
                "If the user asks for a task like booking or approval, explain the next step. " +
                "\n\nPERSONAL DATA (current user):\n" +
                (personalContext == null || personalContext.isBlank() ? "No personal data available." : personalContext) +
                (request.context() == null || request.context().isBlank() ? "" : "\n\nKnowledge/Policy context:\n" + request.context()) +
                "\n\nUser message: " + request.message();
    }
}
