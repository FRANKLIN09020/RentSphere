package com.rentsphere.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.rentsphere.entity.User;
import com.rentsphere.entity.UserRole;
import com.rentsphere.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class LocalAdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.local-admin.email}")
    private String email;

    @Value("${app.local-admin.password}")
    private String password;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(email)) {
            return;
        }

        userRepository.save(User.builder()
                .name("RentSphere Admin")
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(UserRole.ADMIN)
                .build());
    }
}
