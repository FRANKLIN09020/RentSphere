package com.rentsphere.security;

import java.util.UUID;

import org.springframework.security.core.AuthenticatedPrincipal;

public record UserPrincipal(String username, UUID organizationId) implements AuthenticatedPrincipal {

    @Override
    public String getName() {
        return username;
    }

    public boolean isAdmin() {
        return false;
    }
}
