package com.rentsphere.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.Payment;
import com.rentsphere.entity.PaymentStatus;
import com.rentsphere.repository.PaymentRepository;

@Service
public class PaymentService extends BaseCrudService<Payment> {

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        super(paymentRepository, "Payment");
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    @CacheEvict(cacheResolver = "baseCrudCacheResolver", allEntries = true)
    public Payment createRazorpayOrderPayment(UUID organizationId, UUID invoiceId, BigDecimal amount, String razorpayOrderId) {
        Payment payment = Payment.builder()
                .organizationId(organizationId)
                .invoiceId(invoiceId)
                .amount(amount)
                .status(PaymentStatus.PENDING)
                .razorpayOrderId(razorpayOrderId)
                .build();
        return paymentRepository.save(payment);
    }

    @Transactional
    @CacheEvict(cacheResolver = "baseCrudCacheResolver", allEntries = true)
    public Payment recordSuccessfulPayment(String razorpayOrderId, UUID invoiceId, BigDecimal amount, UUID organizationId, String razorpayPaymentId) {
        Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseGet(() -> Payment.builder()
                        .organizationId(organizationId)
                        .invoiceId(invoiceId)
                        .amount(amount)
                        .razorpayOrderId(razorpayOrderId)
                        .build());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaymentDate(LocalDateTime.now());
        payment.setRazorpayPaymentId(razorpayPaymentId);
        return paymentRepository.save(payment);
    }

    @Transactional
    @CacheEvict(cacheResolver = "baseCrudCacheResolver", allEntries = true)
    public Optional<Payment> markRazorpayFailed(String razorpayOrderId) {
        return paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                .map(payment -> {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setPaymentDate(LocalDateTime.now());
                    return paymentRepository.save(payment);
                });
    }

    @Transactional(readOnly = true)
    public List<Payment> findByInvoiceIds(List<UUID> invoiceIds) {
        if (invoiceIds.isEmpty()) {
            return List.of();
        }
        return paymentRepository.findByInvoiceIdIn(invoiceIds);
    }

    @Override
    protected void applyUpdates(Payment entity, Payment request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setInvoiceId(request.getInvoiceId());
        entity.setAmount(request.getAmount());
        entity.setStatus(request.getStatus());
        entity.setPaymentDate(request.getPaymentDate());
    }
}
