package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.rentsphere.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findTop50ByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(String recipientEmail);
    List<Notification> findByRecipientEmailIgnoreCaseAndReadAtIsNull(String recipientEmail);
}
