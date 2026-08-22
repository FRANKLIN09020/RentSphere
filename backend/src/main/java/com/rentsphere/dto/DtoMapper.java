package com.rentsphere.dto;

import java.util.List;

import com.rentsphere.entity.Agreement;
import com.rentsphere.entity.ApprovalRequest;
import com.rentsphere.entity.Building;
import com.rentsphere.entity.Complaint;
import com.rentsphere.entity.DepositDispute;
import com.rentsphere.entity.Invoice;
import com.rentsphere.entity.Organization;
import com.rentsphere.entity.Payment;
import com.rentsphere.entity.Property;
import com.rentsphere.entity.RentIncrease;
import com.rentsphere.entity.Tenant;
import com.rentsphere.entity.Unit;
import com.rentsphere.entity.User;

import lombok.experimental.UtilityClass;

@UtilityClass
public class DtoMapper {

    public static OrganizationResponse toResponse(Organization entity) {
        if (entity == null) return null;
        return OrganizationResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .address(entity.getAddress())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Organization toEntity(OrganizationRequest request) {
        if (request == null) return null;
        return Organization.builder()
                .name(request.getName())
                .address(request.getAddress())
                .phone(request.getPhone())
                .email(request.getEmail())
                .build();
    }

    public static void updateEntity(Organization entity, OrganizationRequest request) {
        if (request == null) return;
        entity.setName(request.getName());
        entity.setAddress(request.getAddress());
        entity.setPhone(request.getPhone());
        entity.setEmail(request.getEmail());
    }

    public static UserResponse toResponse(User entity) {
        if (entity == null) return null;
        return UserResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .name(entity.getName())
                .email(entity.getEmail())
                .role(entity.getRole())
                .phone(entity.getPhone())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static User toEntity(UserRequest request) {
        if (request == null) return null;
        return User.builder()
                .organizationId(request.getOrganizationId())
                .name(request.getName())
                .email(request.getEmail())
                .password(request.getPassword())
                .role(request.getRole())
                .phone(request.getPhone())
                .build();
    }

    public static void updateEntity(User entity, UserRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setName(request.getName());
        entity.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            entity.setPassword(request.getPassword());
        }
        entity.setRole(request.getRole());
        entity.setPhone(request.getPhone());
    }

    public static PropertyResponse toResponse(Property entity) {
        if (entity == null) return null;
        return PropertyResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .ownerId(entity.getOwnerId())
                .name(entity.getName())
                .address(entity.getAddress())
                .city(entity.getCity())
                .state(entity.getState())
                .amenities(entity.getAmenities())
                .imageUrl(entity.getImageUrl())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Property toEntity(PropertyRequest request) {
        if (request == null) return null;
        return Property.builder()
                .organizationId(request.getOrganizationId())
                .ownerId(request.getOwnerId())
                .name(request.getName())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .amenities(request.getAmenities())
                .imageUrl(request.getImageUrl())
                .build();
    }

    public static void updateEntity(Property entity, PropertyRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setOwnerId(request.getOwnerId());
        entity.setName(request.getName());
        entity.setAddress(request.getAddress());
        entity.setCity(request.getCity());
        entity.setState(request.getState());
        entity.setAmenities(request.getAmenities());
        entity.setImageUrl(request.getImageUrl());
    }

    public static BuildingResponse toResponse(Building entity) {
        if (entity == null) return null;
        return BuildingResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .propertyId(entity.getPropertyId())
                .name(entity.getName())
                .floors(entity.getFloors())
                .imageUrl(entity.getImageUrl())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Building toEntity(BuildingRequest request) {
        if (request == null) return null;
        return Building.builder()
                .organizationId(request.getOrganizationId())
                .propertyId(request.getPropertyId())
                .name(request.getName())
                .floors(request.getFloors())
                .imageUrl(request.getImageUrl())
                .build();
    }

    public static void updateEntity(Building entity, BuildingRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setPropertyId(request.getPropertyId());
        entity.setName(request.getName());
        entity.setFloors(request.getFloors());
        entity.setImageUrl(request.getImageUrl());
    }

    public static UnitResponse toResponse(Unit entity) {
        if (entity == null) return null;
        return UnitResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .buildingId(entity.getBuildingId())
                .unitNumber(entity.getUnitNumber())
                .rentAmount(entity.getRentAmount())
                .status(entity.getStatus())
                .imageUrl(entity.getImageUrl())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Unit toEntity(UnitRequest request) {
        if (request == null) return null;
        return Unit.builder()
                .organizationId(request.getOrganizationId())
                .buildingId(request.getBuildingId())
                .unitNumber(request.getUnitNumber())
                .rentAmount(request.getRentAmount())
                .status(request.getStatus())
                .imageUrl(request.getImageUrl())
                .build();
    }

    public static void updateEntity(Unit entity, UnitRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setBuildingId(request.getBuildingId());
        entity.setUnitNumber(request.getUnitNumber());
        entity.setRentAmount(request.getRentAmount());
        entity.setStatus(request.getStatus());
        entity.setImageUrl(request.getImageUrl());
    }

    public static TenantResponse toResponse(Tenant entity) {
        if (entity == null) return null;
        return TenantResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .userId(entity.getUserId())
                .unitId(entity.getUnitId())
                .fullName(entity.getFullName())
                .phone(entity.getPhone())
                .emergencyContact(entity.getEmergencyContact())
                .kycStatus(entity.getKycStatus())
                .idProofUrl(entity.getIdProofUrl())
                .addressProofUrl(entity.getAddressProofUrl())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Tenant toEntity(TenantRequest request) {
        if (request == null) return null;
        return Tenant.builder()
                .organizationId(request.getOrganizationId())
                .userId(request.getUserId())
                .unitId(request.getUnitId())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .emergencyContact(request.getEmergencyContact())
                .kycStatus(request.getKycStatus())
                .idProofUrl(request.getIdProofUrl())
                .addressProofUrl(request.getAddressProofUrl())
                .build();
    }

    public static void updateEntity(Tenant entity, TenantRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setUserId(request.getUserId());
        entity.setUnitId(request.getUnitId());
        entity.setFullName(request.getFullName());
        entity.setPhone(request.getPhone());
        entity.setEmergencyContact(request.getEmergencyContact());
        entity.setKycStatus(request.getKycStatus());
        entity.setIdProofUrl(request.getIdProofUrl());
        entity.setAddressProofUrl(request.getAddressProofUrl());
    }

    public static AgreementResponse toResponse(Agreement entity) {
        if (entity == null) return null;
        return AgreementResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .tenantId(entity.getTenantId())
                .unitId(entity.getUnitId())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .rentAmount(entity.getRentAmount())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Agreement toEntity(AgreementRequest request) {
        if (request == null) return null;
        return Agreement.builder()
                .organizationId(request.getOrganizationId())
                .tenantId(request.getTenantId())
                .unitId(request.getUnitId())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .rentAmount(request.getRentAmount())
                .status(request.getStatus())
                .build();
    }

    public static void updateEntity(Agreement entity, AgreementRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setUnitId(request.getUnitId());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());
        entity.setRentAmount(request.getRentAmount());
        entity.setStatus(request.getStatus());
    }

    public static InvoiceResponse toResponse(Invoice entity) {
        if (entity == null) return null;
        return InvoiceResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .tenantId(entity.getTenantId())
                .agreementId(entity.getAgreementId())
                .amount(entity.getAmount())
                .dueDate(entity.getDueDate())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Invoice toEntity(InvoiceRequest request) {
        if (request == null) return null;
        return Invoice.builder()
                .organizationId(request.getOrganizationId())
                .tenantId(request.getTenantId())
                .agreementId(request.getAgreementId())
                .amount(request.getAmount())
                .dueDate(request.getDueDate())
                .status(request.getStatus())
                .build();
    }

    public static void updateEntity(Invoice entity, InvoiceRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setAgreementId(request.getAgreementId());
        entity.setAmount(request.getAmount());
        entity.setDueDate(request.getDueDate());
        entity.setStatus(request.getStatus());
    }

    public static PaymentResponse toResponse(Payment entity) {
        if (entity == null) return null;
        return PaymentResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .invoiceId(entity.getInvoiceId())
                .amount(entity.getAmount())
                .status(entity.getStatus())
                .paymentDate(entity.getPaymentDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Payment toEntity(PaymentRequest request) {
        if (request == null) return null;
        return Payment.builder()
                .organizationId(request.getOrganizationId())
                .invoiceId(request.getInvoiceId())
                .amount(request.getAmount())
                .status(request.getStatus())
                .paymentDate(request.getPaymentDate())
                .build();
    }

    public static void updateEntity(Payment entity, PaymentRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setInvoiceId(request.getInvoiceId());
        entity.setAmount(request.getAmount());
        entity.setStatus(request.getStatus());
        entity.setPaymentDate(request.getPaymentDate());
    }

    public static RentIncreaseResponse toResponse(RentIncrease entity) {
        if (entity == null) return null;
        return RentIncreaseResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .tenantId(entity.getTenantId())
                .unitId(entity.getUnitId())
                .agreementId(entity.getAgreementId())
                .previousRent(entity.getPreviousRent())
                .proposedRent(entity.getProposedRent())
                .increaseAmount(entity.getIncreaseAmount())
                .increasePercent(entity.getIncreasePercent())
                .noticeDate(entity.getNoticeDate())
                .effectiveDate(entity.getEffectiveDate())
                .notificationScheduledAt(entity.getNotificationScheduledAt())
                .notificationSentAt(entity.getNotificationSentAt())
                .reason(entity.getReason())
                .tenantResponse(entity.getTenantResponse())
                .ownerNotes(entity.getOwnerNotes())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static RentIncrease toEntity(RentIncreaseRequest request) {
        if (request == null) return null;
        return RentIncrease.builder()
                .organizationId(request.getOrganizationId())
                .tenantId(request.getTenantId())
                .unitId(request.getUnitId())
                .agreementId(request.getAgreementId())
                .previousRent(request.getPreviousRent())
                .proposedRent(request.getProposedRent())
                .increaseAmount(request.getIncreaseAmount())
                .increasePercent(request.getIncreasePercent())
                .noticeDate(request.getNoticeDate())
                .effectiveDate(request.getEffectiveDate())
                .notificationScheduledAt(request.getNotificationScheduledAt())
                .notificationSentAt(request.getNotificationSentAt())
                .reason(request.getReason())
                .tenantResponse(request.getTenantResponse())
                .ownerNotes(request.getOwnerNotes())
                .status(request.getStatus())
                .build();
    }

    public static void updateEntity(RentIncrease entity, RentIncreaseRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setUnitId(request.getUnitId());
        entity.setAgreementId(request.getAgreementId());
        entity.setPreviousRent(request.getPreviousRent());
        entity.setProposedRent(request.getProposedRent());
        entity.setIncreaseAmount(request.getIncreaseAmount());
        entity.setIncreasePercent(request.getIncreasePercent());
        entity.setNoticeDate(request.getNoticeDate());
        entity.setEffectiveDate(request.getEffectiveDate());
        entity.setNotificationScheduledAt(request.getNotificationScheduledAt());
        entity.setNotificationSentAt(request.getNotificationSentAt());
        entity.setReason(request.getReason());
        entity.setTenantResponse(request.getTenantResponse());
        entity.setOwnerNotes(request.getOwnerNotes());
        entity.setStatus(request.getStatus());
    }

    public static ComplaintResponse toResponse(Complaint entity) {
        if (entity == null) return null;
        return ComplaintResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .tenantId(entity.getTenantId())
                .unitId(entity.getUnitId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static Complaint toEntity(ComplaintRequest request) {
        if (request == null) return null;
        return Complaint.builder()
                .organizationId(request.getOrganizationId())
                .tenantId(request.getTenantId())
                .unitId(request.getUnitId())
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .build();
    }

    public static void updateEntity(Complaint entity, ComplaintRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setUnitId(request.getUnitId());
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setStatus(request.getStatus());
    }

    public static DepositDisputeResponse toResponse(DepositDispute entity) {
        if (entity == null) return null;
        return DepositDisputeResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .tenantId(entity.getTenantId())
                .unitId(entity.getUnitId())
                .agreementId(entity.getAgreementId())
                .depositAmount(entity.getDepositAmount())
                .deductedAmount(entity.getDeductedAmount())
                .ownerRepairEstimate(entity.getOwnerRepairEstimate())
                .marketRepairEstimate(entity.getMarketRepairEstimate())
                .proposedSettlementAmount(entity.getProposedSettlementAmount())
                .deductionReason(entity.getDeductionReason())
                .evidenceUrl(entity.getEvidenceUrl())
                .tenantNotes(entity.getTenantNotes())
                .ownerResponse(entity.getOwnerResponse())
                .settlementDueDate(entity.getSettlementDueDate())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static DepositDispute toEntity(DepositDisputeRequest request) {
        if (request == null) return null;
        return DepositDispute.builder()
                .organizationId(request.getOrganizationId())
                .tenantId(request.getTenantId())
                .unitId(request.getUnitId())
                .agreementId(request.getAgreementId())
                .depositAmount(request.getDepositAmount())
                .deductedAmount(request.getDeductedAmount())
                .ownerRepairEstimate(request.getOwnerRepairEstimate())
                .marketRepairEstimate(request.getMarketRepairEstimate())
                .proposedSettlementAmount(request.getProposedSettlementAmount())
                .deductionReason(request.getDeductionReason())
                .evidenceUrl(request.getEvidenceUrl())
                .tenantNotes(request.getTenantNotes())
                .ownerResponse(request.getOwnerResponse())
                .settlementDueDate(request.getSettlementDueDate())
                .status(request.getStatus())
                .build();
    }

    public static void updateEntity(DepositDispute entity, DepositDisputeRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setUnitId(request.getUnitId());
        entity.setAgreementId(request.getAgreementId());
        entity.setDepositAmount(request.getDepositAmount());
        entity.setDeductedAmount(request.getDeductedAmount());
        entity.setOwnerRepairEstimate(request.getOwnerRepairEstimate());
        entity.setMarketRepairEstimate(request.getMarketRepairEstimate());
        entity.setProposedSettlementAmount(request.getProposedSettlementAmount());
        entity.setDeductionReason(request.getDeductionReason());
        entity.setEvidenceUrl(request.getEvidenceUrl());
        entity.setTenantNotes(request.getTenantNotes());
        entity.setOwnerResponse(request.getOwnerResponse());
        entity.setSettlementDueDate(request.getSettlementDueDate());
        entity.setStatus(request.getStatus());
    }

    public static ApprovalRequestResponse toResponse(ApprovalRequest entity) {
        if (entity == null) return null;
        return ApprovalRequestResponse.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganizationId())
                .type(entity.getType())
                .subject(entity.getSubject())
                .details(entity.getDetails())
                .requesterEmail(entity.getRequesterEmail())
                .approverEmail(entity.getApproverEmail())
                .status(entity.getStatus())
                .decisionComment(entity.getDecisionComment())
                .decidedAt(entity.getDecidedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static ApprovalRequest toEntity(ApprovalRequestRequest request) {
        if (request == null) return null;
        return ApprovalRequest.builder()
                .organizationId(request.getOrganizationId())
                .type(request.getType())
                .subject(request.getSubject())
                .details(request.getDetails())
                .requesterEmail(request.getRequesterEmail())
                .approverEmail(request.getApproverEmail())
                .status(request.getStatus() != null ? request.getStatus() : com.rentsphere.entity.ApprovalStatus.PENDING)
                .build();
    }

    public static void updateEntity(ApprovalRequest entity, ApprovalRequestRequest request) {
        if (request == null) return;
        entity.setOrganizationId(request.getOrganizationId());
        entity.setType(request.getType());
        entity.setSubject(request.getSubject());
        entity.setDetails(request.getDetails());
        entity.setRequesterEmail(request.getRequesterEmail());
        entity.setApproverEmail(request.getApproverEmail());
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
    }

    public static <T, R> List<R> toResponseList(List<T> entities, java.util.function.Function<T, R> mapper) {
        return entities.stream().map(mapper).toList();
    }
}
