package com.rentsphere.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.dto.ApprovalCreateRequest;
import com.rentsphere.dto.ApprovalDecisionRequest;
import com.rentsphere.entity.ApprovalRequest;
import com.rentsphere.entity.ApprovalStatus;
import com.rentsphere.entity.UserRole;
import com.rentsphere.exception.InvalidApprovalStateException;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.repository.ApprovalRequestRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ApprovalRequestService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final EmailNotificationService emailNotificationService;

    @Transactional
    @CacheEvict(cacheNames = "approvalRequests", allEntries = true)
    public ApprovalRequest create(ApprovalCreateRequest request) {
        ApprovalRequest approvalRequest = ApprovalRequest.builder()
                .organizationId(request.getOrganizationId())
                .type(request.getType())
                .subject(request.getSubject())
                .details(request.getDetails())
                .requesterEmail(request.getRequesterEmail())
                .approverEmail(request.getApproverEmail())
                .status(ApprovalStatus.PENDING)
                .build();

        ApprovalRequest saved = approvalRequestRepository.save(approvalRequest);
        emailNotificationService.sendApprovalCreated(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "approvalRequests", key = "#status != null ? #status.name() : 'ALL'")
    public List<ApprovalRequest> findAll(ApprovalStatus status) {
        if (status == null) {
            return approvalRequestRepository.findAll();
        }

        return approvalRequestRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "approvalRequests", key = "#role.name() + ':' + #requesterEmail + ':' + (#status != null ? #status.name() : 'ALL')")
    public List<ApprovalRequest> findAll(ApprovalStatus status, String requesterEmail, UserRole role) {
        if (role == UserRole.TENANT) {
            if (status == null) {
                return approvalRequestRepository.findByRequesterEmail(requesterEmail);
            }
            return approvalRequestRepository.findByRequesterEmailAndStatus(requesterEmail, status);
        }

        return findAll(status);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "approvalRequests", key = "#id")
    public ApprovalRequest findById(UUID id) {
        return approvalRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Approval request", id));
    }

    @Transactional(readOnly = true)
    public ApprovalRequest findById(UUID id, String requesterEmail, UserRole role) {
        ApprovalRequest approvalRequest = findById(id);
        if (role == UserRole.TENANT && !approvalRequest.getRequesterEmail().equalsIgnoreCase(requesterEmail)) {
            throw new AccessDeniedException("Access denied to this approval request");
        }
        return approvalRequest;
    }

    @Transactional
    @CacheEvict(cacheNames = "approvalRequests", allEntries = true)
    public ApprovalRequest approve(UUID id, ApprovalDecisionRequest request) {
        ApprovalRequest approvalRequest = decide(id, ApprovalStatus.APPROVED, request);
        emailNotificationService.sendApprovalDecided(approvalRequest);
        return approvalRequest;
    }

    @Transactional
    @CacheEvict(cacheNames = "approvalRequests", allEntries = true)
    public ApprovalRequest reject(UUID id, ApprovalDecisionRequest request) {
        ApprovalRequest approvalRequest = decide(id, ApprovalStatus.REJECTED, request);
        emailNotificationService.sendApprovalDecided(approvalRequest);
        return approvalRequest;
    }

    @Transactional
    @CacheEvict(cacheNames = "approvalRequests", allEntries = true)
    public void delete(UUID id) {
        ApprovalRequest approvalRequest = findById(id);
        approvalRequestRepository.delete(approvalRequest);
    }

    private ApprovalRequest decide(UUID id, ApprovalStatus status, ApprovalDecisionRequest request) {
        ApprovalRequest approvalRequest = findById(id);

        if (approvalRequest.getStatus() != ApprovalStatus.PENDING) {
            throw new InvalidApprovalStateException("Only pending approval requests can be decided");
        }

        approvalRequest.setStatus(status);
        approvalRequest.setDecisionComment(request == null ? null : request.getComment());
        approvalRequest.setDecidedAt(LocalDateTime.now());
        return approvalRequestRepository.save(approvalRequest);
    }
}
