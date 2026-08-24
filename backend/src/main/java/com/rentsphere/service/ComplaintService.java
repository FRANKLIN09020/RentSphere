package com.rentsphere.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

import com.rentsphere.entity.Complaint;
import com.rentsphere.repository.ComplaintRepository;

@Service
public class ComplaintService extends BaseCrudService<Complaint> {
    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;
    private final AiInsightService aiInsightService;

    public ComplaintService(
            ComplaintRepository complaintRepository,
            NotificationService notificationService,
            AiInsightService aiInsightService) {
        super(complaintRepository, "Complaint");
        this.complaintRepository = complaintRepository;
        this.notificationService = notificationService;
        this.aiInsightService = aiInsightService;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<Complaint> findAll() {
        return findAllScoped(complaintRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Complaint> findAll(Pageable pageable) {
        return findAllScoped(pageable, complaintRepository::findByOrganizationId);
    }

    public List<Complaint> findByTenantId(UUID tenantId) {
        return complaintRepository.findByTenantId(tenantId);
    }

    @Override
    @Transactional
    public Complaint create(Complaint request) {
        applyAiTriage(request);
        Complaint saved = super.create(request);
        notificationService.notifyOrganization(saved.getOrganizationId(), "New maintenance complaint", saved.getTitle() + " [" + saved.getAiPriority() + "]", "COMPLAINT_CREATED", "/complaints");
        return saved;
    }

    /**
     * Enriches new complaints with AI triage (priority, category, note) using
     * the Llama integration, falling back to deterministic keyword rules so
     * creation never fails when the AI provider is unavailable.
     */
    private void applyAiTriage(Complaint complaint) {
        try {
            AiInsightService.ComplaintTriage triage =
                    aiInsightService.triageComplaint(complaint.getTitle(), complaint.getDescription());
            complaint.setAiPriority(triage.priority());
            complaint.setAiCategory(triage.category());
            complaint.setAiNote(triage.note());
        } catch (Exception ex) {
            complaint.setAiPriority("MEDIUM");
            complaint.setAiCategory("OTHER");
            complaint.setAiNote("Triage unavailable; defaulted to medium priority.");
        }
    }

    @Override
    @Transactional
    public Complaint update(UUID id, Complaint request) {
        Complaint saved = super.update(id, request);
        notificationService.notifyOrganization(saved.getOrganizationId(), "Complaint updated", saved.getTitle() + " is now " + saved.getStatus(), "COMPLAINT_UPDATED", "/complaints");
        return saved;
    }

    @Override
    protected void applyUpdates(Complaint entity, Complaint request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setUnitId(request.getUnitId());
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setStatus(request.getStatus());
    }
}
