package com.rentsphere.entity;

import java.util.UUID;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

public class AuditListener {

    @PrePersist
    public void setCreatedBy(Object entity) {
        UUID userId = getCurrentUserId();
        if (userId == null) return;

        if (entity instanceof BaseEntity baseEntity) {
            if (baseEntity.getCreatedBy() == null) {
                baseEntity.setCreatedBy(userId);
            }
            baseEntity.setUpdatedBy(userId);
        }
    }

    @PreUpdate
    public void setUpdatedBy(Object entity) {
        UUID userId = getCurrentUserId();
        if (userId == null) return;

        if (entity instanceof BaseEntity baseEntity) {
            baseEntity.setUpdatedBy(userId);
        }
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof com.rentsphere.security.UserPrincipal userPrincipal) {
            return UUID.nameUUIDFromBytes(userPrincipal.username().getBytes());
        }
        if (principal instanceof String username) {
            return UUID.nameUUIDFromBytes(username.getBytes());
        }
        return null;
    }
}
