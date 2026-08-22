package com.rentsphere.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.Organization;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
}
