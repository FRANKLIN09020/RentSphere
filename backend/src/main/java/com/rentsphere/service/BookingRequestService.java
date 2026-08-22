package com.rentsphere.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.dto.ApprovalCreateRequest;
import com.rentsphere.dto.BookingRequest;
import com.rentsphere.entity.ApprovalRequest;
import com.rentsphere.entity.Building;
import com.rentsphere.entity.Property;
import com.rentsphere.entity.Unit;
import com.rentsphere.entity.User;
import com.rentsphere.entity.UserRole;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.repository.BuildingRepository;
import com.rentsphere.repository.PropertyRepository;
import com.rentsphere.repository.UnitRepository;
import com.rentsphere.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingRequestService {

    private final ApprovalRequestService approvalRequestService;
    private final BuildingRepository buildingRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;

    @Transactional
    public List<ApprovalRequest> create(String requesterEmail, BookingRequest request) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", requesterEmail));
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property", request.getPropertyId()));
        Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Unit", request.getUnitId()));
        Building building = unit.getBuildingId() == null
                ? null
                : buildingRepository.findById(unit.getBuildingId()).orElse(null);

        UUID organizationId = property.getOrganizationId() != null ? property.getOrganizationId() : requester.getOrganizationId();
        String approverEmail = selectPrimaryApproverEmail(property, organizationId);

        String subject = "Apartment visit request - " + property.getName();
        String details = """
                Tenant: %s
                Tenant email: %s
                Property: %s
                Building: %s
                Unit: %s
                Rent amount: %s
                Visit date: %s
                Visit time: %s
                Note: %s
                """.formatted(
                requester.getName(),
                requester.getEmail(),
                property.getName(),
                building == null ? "Not assigned" : building.getName(),
                unit.getUnitNumber(),
                unit.getRentAmount(),
                request.getVisitDate(),
                request.getVisitTime(),
                request.getNote() == null ? "" : request.getNote()
        );

        return List.of(createApproval(organizationId, requesterEmail, approverEmail, subject, details));
    }

    private String selectPrimaryApproverEmail(Property property, UUID organizationId) {
        if (property.getOwnerId() != null) {
            return userRepository.findById(property.getOwnerId())
                    .map(User::getEmail)
                    .orElseGet(() -> findOrganizationApproverEmail(organizationId));
        }
        String approverEmail = findOrganizationApproverEmail(organizationId);
        if (approverEmail != null) {
            return approverEmail;
        }
        approverEmail = findGlobalApproverEmail();
        if (approverEmail != null) {
            return approverEmail;
        }
        throw new ResourceNotFoundException("Approver email", "No eligible approver found for booking request");
    }

    private String findOrganizationApproverEmail(UUID organizationId) {
        if (organizationId == null) {
            return null;
        }
        return userRepository.findByOrganizationId(organizationId).stream()
                .filter(user -> user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.OWNER)
                .findFirst()
                .map(User::getEmail)
                .orElse(null);
    }

    private String findGlobalApproverEmail() {
        return userRepository.findByRole(UserRole.ADMIN).stream()
                .findFirst()
                .map(User::getEmail)
                .or(() -> userRepository.findByRole(UserRole.OWNER).stream()
                        .findFirst()
                        .map(User::getEmail))
                .orElse(null);
    }

    private ApprovalRequest createApproval(UUID organizationId, String requesterEmail, String approverEmail, String subject, String details) {
        ApprovalCreateRequest approval = new ApprovalCreateRequest();
        approval.setOrganizationId(organizationId);
        approval.setType("APARTMENT_VISIT");
        approval.setSubject(subject);
        approval.setDetails(details);
        approval.setRequesterEmail(requesterEmail);
        approval.setApproverEmail(approverEmail);
        return approvalRequestService.create(approval);
    }
}
