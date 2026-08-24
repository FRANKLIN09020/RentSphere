package com.rentsphere.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.dto.AuthResponse;
import com.rentsphere.dto.ChangePasswordRequest;
import com.rentsphere.dto.LoginRequest;
import com.rentsphere.dto.ProfileUpdateRequest;
import com.rentsphere.dto.RegisterRequest;
import com.rentsphere.dto.UserProfileResponse;
import com.rentsphere.entity.User;
import com.rentsphere.entity.UserRole;
import com.rentsphere.exception.DuplicateResourceException;
import com.rentsphere.exception.InvalidCredentialsException;
import com.rentsphere.repository.UserRepository;
import com.rentsphere.repository.OrganizationRepository;
import com.rentsphere.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TenantService tenantService;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                    "An account with this email already exists. Please sign in or use another email."
            );
        }

        if (request.getRole() != UserRole.TENANT) {
            boolean bootstrapAdmin = request.getRole() == UserRole.ADMIN && userRepository.count() == 0;
            if (!bootstrapAdmin) {
                throw new AccessDeniedException(
                        request.getRole() == UserRole.ADMIN
                                ? "Admin accounts must be created by an existing administrator"
                                : "Owner accounts must be created by an administrator"
                );
            }
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .organizationId(request.getOrganizationId())
                .build();

        User savedUser = userRepository.save(user);
        if (savedUser.getRole() == UserRole.TENANT) {
            tenantService.findOrCreateForUser(savedUser);
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getOrganizationId()
        );

        return new AuthResponse(token);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        return toProfile(findByEmail(email));
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, ProfileUpdateRequest request) {
        User user = findByEmail(email);
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        return toProfile(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findByEmail(email);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);
    }

    private UserProfileResponse toProfile(User user) {
        String organizationName = user.getOrganizationId() == null
                ? null
                : organizationRepository.findById(user.getOrganizationId())
                        .map(organization -> organization.getName())
                        .orElse(null);
        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getOrganizationId(),
                organizationName,
                user.getCreatedAt());
    }
}
