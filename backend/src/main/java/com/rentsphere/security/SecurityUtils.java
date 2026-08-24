package com.rentsphere.security;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import lombok.experimental.UtilityClass;

@UtilityClass
public class SecurityUtils {

    public UUID getCurrentOrganizationId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.organizationId();
        }
        return null;
    }

    public String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.username();
        }
        if (principal instanceof String username) {
            return username;
        }
        return null;
    }

    public boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    public boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    public boolean isTenant() {
        return hasRole("TENANT");
    }

    public boolean hasOrganizationScope() {
        return getCurrentOrganizationId() != null;
    }

    public String cacheScopeKey() {
        if (isAdmin()) return "ADMIN";
        UUID organizationId = getCurrentOrganizationId();
        return organizationId != null ? organizationId.toString() : "UNSCOPED";
    }
}
