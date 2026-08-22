package com.rentsphere.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import com.rentsphere.dto.AuthResponse;
import com.rentsphere.dto.ChangePasswordRequest;
import com.rentsphere.dto.LoginRequest;
import com.rentsphere.dto.ProfileUpdateRequest;
import com.rentsphere.dto.RegisterRequest;
import com.rentsphere.dto.UserProfileResponse;
import com.rentsphere.security.LoginRateLimiter;
import com.rentsphere.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final LoginRateLimiter loginRateLimiter;

    @Value("${app.security.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.security.jwt.cookie-secure:false}")
    private boolean jwtCookieSecure;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        if (!loginRateLimiter.isAllowed(httpRequest)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Too many login attempts. Please try again later.");
        }

        AuthResponse authResponse = authService.login(request);

        ResponseCookie jwtCookie = ResponseCookie.from("rentsphere.token", authResponse.getToken())
                .httpOnly(true)
                .secure(jwtCookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(jwtExpirationMs / 1000)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(authResponse);
    }

    @GetMapping("/me")
    public UserProfileResponse getProfile(Authentication authentication) {
        return authService.getProfile(authentication.getName());
    }

    @PutMapping("/me")
    public UserProfileResponse updateProfile(@Valid @RequestBody ProfileUpdateRequest request, Authentication authentication) {
        return authService.updateProfile(authentication.getName(), request);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        authService.changePassword(authentication.getName(), request);
    }
}
