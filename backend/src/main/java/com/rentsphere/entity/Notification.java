package com.rentsphere.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications", indexes = @Index(name = "idx_notification_recipient_created", columnList = "recipient_email,created_at"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue private UUID id;
    private UUID organizationId;
    @Column(nullable = false) private String recipientEmail;
    @Column(nullable = false) private String title;
    @Column(nullable = false, length = 1000) private String detail;
    @Column(nullable = false) private String type;
    private String targetPath;
    @CreationTimestamp @Column(nullable = false, updatable = false) private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
