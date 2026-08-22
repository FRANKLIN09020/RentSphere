package com.rentsphere.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.rentsphere.entity.ApprovalRequest;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    public EmailNotificationService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    @Value("${app.mail.enabled}")
    private boolean mailEnabled;

    @Value("${app.mail.from}")
    private String fromAddress;

    public void sendApprovalCreated(ApprovalRequest approvalRequest) {
        String subject = "Approval requested: " + approvalRequest.getSubject();
        String body = """
                A new approval request is waiting for your review.

                Type: %s
                Subject: %s
                Details: %s
                Requested by: %s
                Status: %s
                """.formatted(
                approvalRequest.getType(),
                approvalRequest.getSubject(),
                nullToBlank(approvalRequest.getDetails()),
                approvalRequest.getRequesterEmail(),
                approvalRequest.getStatus()
        );

        send(approvalRequest.getApproverEmail(), subject, body);
    }

    public void sendApprovalDecided(ApprovalRequest approvalRequest) {
        String subject = "Approval " + approvalRequest.getStatus() + ": " + approvalRequest.getSubject();
        String body = """
                Your approval request has been decided.

                Type: %s
                Subject: %s
                Status: %s
                Comment: %s
                Decided at: %s
                """.formatted(
                approvalRequest.getType(),
                approvalRequest.getSubject(),
                approvalRequest.getStatus(),
                nullToBlank(approvalRequest.getDecisionComment()),
                approvalRequest.getDecidedAt()
        );

        send(approvalRequest.getRequesterEmail(), subject, body);
    }

    private void send(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("Email notification skipped because MAIL_ENABLED=false. to={}, subject={}", to, subject);
            return;
        }

        if (mailSender == null) {
            log.warn("Email notification skipped because JavaMailSender is not configured. to={}, subject={}", to, subject);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Email notification failed. to={}, subject={}", to, subject, ex);
        }
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }
}
