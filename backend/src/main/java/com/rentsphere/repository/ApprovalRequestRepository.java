package com.rentsphere.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rentsphere.entity.ApprovalRequest;
import com.rentsphere.entity.ApprovalStatus;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, UUID> {

    List<ApprovalRequest> findByStatus(ApprovalStatus status);

    List<ApprovalRequest> findByRequesterEmail(String requesterEmail);

    List<ApprovalRequest> findByRequesterEmailAndStatus(String requesterEmail, ApprovalStatus status);

    List<ApprovalRequest> findByOrganizationId(UUID organizationId);
}
