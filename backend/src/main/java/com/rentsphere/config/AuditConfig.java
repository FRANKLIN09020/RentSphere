package com.rentsphere.config;

import java.util.Optional;
import java.util.UUID;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig {

    @Bean
    public AuditorAware<UUID> auditorProvider() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
                return Optional.empty();
            }
            Object principal = auth.getPrincipal();
            if (principal instanceof com.rentsphere.security.UserPrincipal userPrincipal) {
                return Optional.of(UUID.nameUUIDFromBytes(userPrincipal.username().getBytes()));
            }
            if (principal instanceof String username) {
                return Optional.of(UUID.nameUUIDFromBytes(username.getBytes()));
            }
            return Optional.empty();
        };
    }
}
