package com.rentsphere.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rentsphere.dto.DtoMapper;
import com.rentsphere.dto.PaymentResponse;
import com.rentsphere.dto.RazorpayCreateOrderRequest;
import com.rentsphere.dto.RazorpayCreateOrderResponse;
import com.rentsphere.dto.RazorpayVerifyRequest;
import com.rentsphere.service.RazorpayService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/payments/razorpay")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TENANT','ADMIN','OWNER')")
public class RazorpayController {

    private final RazorpayService razorpayService;

    @PostMapping("/create-order")
    public RazorpayCreateOrderResponse createOrder(@Valid @RequestBody RazorpayCreateOrderRequest request) {
        return razorpayService.createOrder(request.getInvoiceId(), request.getAmount());
    }

    @PostMapping("/verify")
    public PaymentResponse verify(@Valid @RequestBody RazorpayVerifyRequest request) {
        return DtoMapper.toResponse(razorpayService.verifyPayment(
                request.getInvoiceId(),
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()));
    }

    @PostMapping("/webhook")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> webhook(HttpServletRequest request) {
        try {
            String body = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            String signature = request.getHeader("X-Razorpay-Signature");
            String result = razorpayService.handleWebhook(body, signature);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Unable to read webhook body");
        }
    }
}
