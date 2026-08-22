package com.rentsphere.service;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.User;
import com.rentsphere.exception.DuplicateResourceException;
import com.rentsphere.repository.UserRepository;

@Service
public class UserService extends BaseCrudService<User> {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        super(userRepository, "User");
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    @Transactional
    public User create(User request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw duplicateEmail();
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required when creating a user");
        }

        request.setPassword(passwordEncoder.encode(request.getPassword()));
        return userRepository.save(request);
    }

    @Override
    protected void applyUpdates(User entity, User request) {
        if (!entity.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw duplicateEmail();
        }

        entity.setOrganizationId(request.getOrganizationId());
        entity.setName(request.getName());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
        entity.setRole(request.getRole());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            entity.setPassword(passwordEncoder.encode(request.getPassword()));
        }
    }

    private DuplicateResourceException duplicateEmail() {
        return new DuplicateResourceException(
                "An account with this email already exists. Please use another email."
        );
    }
}
