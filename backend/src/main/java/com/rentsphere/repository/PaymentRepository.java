package com.rentsphere.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Payment;
import com.rentsphere.entity.PaymentStatus;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByOrganizationId(UUID organizationId);

    List<Payment> findByInvoiceIdIn(List<UUID> invoiceIds);

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    boolean existsByInvoiceIdAndStatus(UUID invoiceId, PaymentStatus status);
}
