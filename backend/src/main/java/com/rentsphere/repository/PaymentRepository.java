package com.rentsphere.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Payment;
import com.rentsphere.entity.PaymentStatus;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByOrganizationId(UUID organizationId);

    Page<Payment> findByOrganizationId(UUID organizationId, Pageable pageable);

    List<Payment> findByInvoiceIdIn(List<UUID> invoiceIds);

    Optional<Payment> findFirstByRazorpayOrderIdOrderByCreatedAtDesc(String razorpayOrderId);

    Optional<Payment> findFirstByInvoiceIdAndStatusOrderByCreatedAtDesc(UUID invoiceId, PaymentStatus status);

    boolean existsByInvoiceIdAndStatus(UUID invoiceId, PaymentStatus status);
}
