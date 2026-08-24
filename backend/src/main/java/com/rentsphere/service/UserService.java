package com.rentsphere.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.User;
import com.rentsphere.entity.UserRole;
import com.rentsphere.exception.DuplicateResourceException;
import com.rentsphere.repository.UserRepository;
import com.rentsphere.security.SecurityUtils;

@Service
public class UserService extends BaseCrudService<User> {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        super(userRepository, "User");
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<User> findAll() {
        return findAllScoped(userRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> findAll(Pageable pageable) {
        return findAllScoped(pageable, userRepository::findByOrganizationId);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    @Transactional
    public User create(User request) {
        assertCanManageRole(request.getRole());

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
    @Transactional
    public User update(UUID id, User request) {
        User existing = findById(id);
        assertCanManageRole(existing.getRole());
        assertCanManageRole(request.getRole());
        return super.update(id, request);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        User existing = findById(id);
        assertCanManageRole(existing.getRole());
        super.delete(id);
    }

    /**
     * Prevents privilege escalation: only administrators may create, modify or
     * delete ADMIN accounts. Owners can manage their organization's staff and
     * tenant accounts but can never grant or take over the ADMIN role.
     */
    private void assertCanManageRole(UserRole role) {
        if (role == UserRole.ADMIN && !SecurityUtils.isAdmin()) {
            throw new AccessDeniedException("Only administrators can manage admin accounts");
        }
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
