package com.rentsphere.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

@Service
public class JwtService {

    private static final String EXAMPLE_SECRET = "change-this-to-a-secure-random-string-at-least-32-chars-long";

    @Value("${app.security.jwt.secret}")
    private String secretKey;

    @Value("${app.security.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @PostConstruct
    public void validateConfiguration() {
        byte[] keyBytes = secretKey == null ? new byte[0] : secretKey.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT secret must be at least 32 bytes long. Configure app.security.jwt.secret (JWT_SECRET env var) "
                            + "with a secure random value before starting the application."
            );
        }
        if (EXAMPLE_SECRET.equals(secretKey)) {
            throw new IllegalStateException(
                    "JWT secret is still set to the example placeholder value. Set JWT_SECRET to a unique, "
                            + "secure random value before starting the application."
            );
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = this.secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String username) {
        return generateToken(new HashMap<>(), username);
    }

    public String generateToken(String username, String role) {
        return generateToken(username, role, null);
    }

    public String generateToken(String username, String role, UUID organizationId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        if (organizationId != null) {
            claims.put("organizationId", organizationId.toString());
        }
        return generateToken(claims, username);
    }

    public String generateToken(Map<String, Object> extraClaims, String username) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(username)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        return extractUsername(token) != null && !isTokenExpired(token);
    }

    public List<String> extractAuthorities(String token) {
        Object role = extractAllClaims(token).get("role");
        if (role == null) {
            return List.of();
        }
        return List.of("ROLE_" + role);
    }

    public String extractOrganizationId(String token) {
        Object orgId = extractAllClaims(token).get("organizationId");
        return orgId != null ? orgId.toString() : null;
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
