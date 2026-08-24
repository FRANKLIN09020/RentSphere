package com.rentsphere.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.User;
import com.rentsphere.entity.UserRole;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    List<User> findByRole(UserRole role);

    List<User> findByOrganizationIdAndRole(UUID organizationId, UserRole role);

    List<User> findByOrganizationId(UUID organizationId);

    Page<User> findByOrganizationId(UUID organizationId, Pageable pageable);

    boolean existsByEmail(String email);
}
