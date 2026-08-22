package com.rentsphere.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.rentsphere.entity.Agreement;
import com.rentsphere.entity.ApprovalRequest;
import com.rentsphere.entity.ApprovalStatus;
import com.rentsphere.entity.Building;
import com.rentsphere.entity.Complaint;
import com.rentsphere.entity.DepositDispute;
import com.rentsphere.entity.Invoice;
import com.rentsphere.entity.Payment;
import com.rentsphere.entity.Property;
import com.rentsphere.entity.RentIncrease;
import com.rentsphere.entity.Tenant;
import com.rentsphere.entity.Unit;
import com.rentsphere.entity.User;
import com.rentsphere.entity.UserRole;
import com.rentsphere.repository.AgreementRepository;
import com.rentsphere.repository.ApprovalRequestRepository;
import com.rentsphere.repository.BuildingRepository;
import com.rentsphere.repository.ComplaintRepository;
import com.rentsphere.repository.DepositDisputeRepository;
import com.rentsphere.repository.InvoiceRepository;
import com.rentsphere.repository.PaymentRepository;
import com.rentsphere.repository.PropertyRepository;
import com.rentsphere.repository.RentIncreaseRepository;
import com.rentsphere.repository.TenantRepository;
import com.rentsphere.repository.UnitRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserPersonalContextService {

    private final TenantRepository tenantRepository;
    private final UnitRepository unitRepository;
    private final BuildingRepository buildingRepository;
    private final PropertyRepository propertyRepository;
    private final AgreementRepository agreementRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ComplaintRepository complaintRepository;
    private final RentIncreaseRepository rentIncreaseRepository;
    private final DepositDisputeRepository depositDisputeRepository;
    private final ApprovalRequestRepository approvalRequestRepository;

    public String buildContext(User user) {
        if (user == null) {
            return "No personal data available for the current user.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("PERSONAL DATA FOR THE CURRENTLY LOGGED-IN USER\n");
        sb.append("Name: ").append(nvl(user.getName()))
                .append(" | Email: ").append(nvl(user.getEmail()))
                .append(" | Phone: ").append(nvl(user.getPhone()))
                .append(" | Role: ").append(nvl(user.getRole())).append("\n");

        if (user.getRole() == UserRole.TENANT) {
            appendTenantContext(user, sb);
        } else if (user.getRole() == UserRole.OWNER) {
            appendOwnerContext(user, sb);
        } else if (user.getRole() == UserRole.ADMIN) {
            appendAdminContext(user, sb);
        }
        return sb.toString();
    }

    private void appendTenantContext(User user, StringBuilder sb) {
        List<Tenant> tenants = tenantRepository.findByUserId(user.getId());
        if (tenants.isEmpty()) {
            sb.append("Tenant profile: not yet registered as a tenant.\n");
            return;
        }
        Tenant tenant = tenants.get(0);
        sb.append("Tenant profile: KYC status ").append(nvl(tenant.getKycStatus()))
                .append(" | phone ").append(nvl(tenant.getPhone()))
                .append(" | emergency contact ").append(nvl(tenant.getEmergencyContact())).append("\n");

        if (tenant.getUnitId() != null) {
            unitRepository.findById(tenant.getUnitId()).ifPresent(unit -> {
                sb.append("Booked unit: ").append(nvl(unit.getUnitNumber()))
                        .append(" | rent ").append(nvl(unit.getRentAmount()))
                        .append(" | status ").append(nvl(unit.getStatus())).append("\n");
                if (unit.getBuildingId() != null) {
                    buildingRepository.findById(unit.getBuildingId()).ifPresent(building -> {
                        sb.append("Building: ").append(nvl(building.getName())).append("\n");
                        if (building.getPropertyId() != null) {
                            propertyRepository.findById(building.getPropertyId()).ifPresent(property -> {
                                sb.append("Property: ").append(nvl(property.getName()))
                                        .append(" | address ").append(nvl(property.getAddress()))
                                        .append(" | ").append(nvl(property.getCity())).append(" ").append(nvl(property.getState()))
                                        .append(" | amenities ").append(nvl(property.getAmenities())).append("\n");
                            });
                        }
                    });
                }
            });
        }

        List<Agreement> agreements = agreementRepository.findByTenantId(tenant.getId());
        if (!agreements.isEmpty()) {
            sb.append("Agreements:\n");
            agreements.forEach(a -> sb.append(" - status ").append(nvl(a.getStatus()))
                    .append(" | start ").append(nvl(a.getStartDate()))
                    .append(" | end ").append(nvl(a.getEndDate()))
                    .append(" | rent ").append(nvl(a.getRentAmount())).append("\n"));
        }

        List<Invoice> invoices = invoiceRepository.findByTenantId(tenant.getId());
        if (!invoices.isEmpty()) {
            List<UUID> invoiceIds = invoices.stream().map(Invoice::getId).toList();
            List<Payment> payments = paymentRepository.findByInvoiceIdIn(invoiceIds);
            sb.append("Invoices:\n");
            invoices.forEach(i -> sb.append(" - amount ").append(nvl(i.getAmount()))
                    .append(" | due ").append(nvl(i.getDueDate()))
                    .append(" | status ").append(nvl(i.getStatus())).append("\n"));
            if (!payments.isEmpty()) {
                sb.append("Payments:\n");
                payments.forEach(p -> sb.append(" - amount ").append(nvl(p.getAmount()))
                        .append(" | status ").append(nvl(p.getStatus()))
                        .append(" | paid on ").append(nvl(p.getPaymentDate())).append("\n"));
            }
        }

        List<Complaint> complaints = complaintRepository.findByTenantId(tenant.getId());
        if (!complaints.isEmpty()) {
            sb.append("Complaints:\n");
            complaints.forEach(c -> sb.append(" - ").append(nvl(c.getTitle()))
                    .append(" | status ").append(nvl(c.getStatus())).append("\n"));
        }

        List<RentIncrease> increases = rentIncreaseRepository.findByTenantId(tenant.getId());
        if (!increases.isEmpty()) {
            sb.append("Rent increases:\n");
            increases.forEach(r -> sb.append(" - previous ").append(nvl(r.getPreviousRent()))
                    .append(" -> proposed ").append(nvl(r.getProposedRent()))
                    .append(" | effective ").append(nvl(r.getEffectiveDate()))
                    .append(" | status ").append(nvl(r.getStatus())).append("\n"));
        }

        List<DepositDispute> disputes = depositDisputeRepository.findByTenantId(tenant.getId());
        if (!disputes.isEmpty()) {
            sb.append("Deposit disputes:\n");
            disputes.forEach(d -> sb.append(" - deposit ").append(nvl(d.getDepositAmount()))
                    .append(" | deducted ").append(nvl(d.getDeductedAmount()))
                    .append(" | status ").append(nvl(d.getStatus())).append("\n"));
        }

        List<ApprovalRequest> approvals = approvalRequestRepository.findByRequesterEmail(user.getEmail());
        if (!approvals.isEmpty()) {
            sb.append("Booking/visit requests sent by this user:\n");
            approvals.forEach(a -> sb.append(" - ").append(nvl(a.getType()))
                    .append(" | ").append(nvl(a.getSubject()))
                    .append(" | status ").append(nvl(a.getStatus()))
                    .append(" | decided at ").append(a.getDecidedAt() == null ? "pending" : String.valueOf(a.getDecidedAt())).append("\n"));
        }
    }

    private void appendOwnerContext(User user, StringBuilder sb) {
        List<Property> properties = propertyRepository.findByOwnerId(user.getId());
        sb.append("Owned properties: ").append(properties.size()).append("\n");
        properties.forEach(p -> {
            sb.append(" - ").append(nvl(p.getName()))
                    .append(" | address ").append(nvl(p.getAddress()))
                    .append(" | ").append(nvl(p.getCity())).append(" ").append(nvl(p.getState())).append("\n");
            List<Building> buildings = buildingRepository.findByPropertyId(p.getId());
            long unitCount = buildings.stream()
                    .flatMap(b -> unitRepository.findByBuildingId(b.getId()).stream())
                    .count();
            sb.append("   buildings: ").append(buildings.size())
                    .append(" | units: ").append(unitCount).append("\n");
        });
    }

    private void appendAdminContext(User user, StringBuilder sb) {
        UUID orgId = user.getOrganizationId();
        if (orgId == null) {
            return;
        }
        sb.append("Organization overview (organizationId ").append(orgId).append("):\n");
        sb.append(" - properties: ").append(propertyRepository.findByOrganizationId(orgId).size()).append("\n");
        sb.append(" - buildings: ").append(buildingRepository.findByOrganizationId(orgId).size()).append("\n");
        sb.append(" - units: ").append(unitRepository.findByOrganizationId(orgId).size()).append("\n");
        sb.append(" - tenants: ").append(tenantRepository.findByOrganizationId(orgId).size()).append("\n");
        sb.append(" - agreements: ").append(agreementRepository.findByOrganizationId(orgId).size()).append("\n");
        sb.append(" - invoices: ").append(invoiceRepository.findByOrganizationId(orgId).size()).append("\n");
        sb.append(" - complaints: ").append(complaintRepository.findByOrganizationId(orgId).size()).append("\n");
        sb.append(" - rent increases: ").append(rentIncreaseRepository.findByOrganizationId(orgId).size()).append("\n");
        long pendingApprovals = approvalRequestRepository.findByOrganizationId(orgId).stream()
                .filter(a -> a.getStatus() == ApprovalStatus.PENDING)
                .count();
        sb.append(" - pending approvals: ").append(pendingApprovals).append("\n");
    }

    private static String nvl(Object value) {
        return value == null ? "-" : String.valueOf(value);
    }
}
