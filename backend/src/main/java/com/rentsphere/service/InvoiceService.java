package com.rentsphere.service;

import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.Invoice;
import com.rentsphere.entity.InvoiceStatus;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.repository.InvoiceRepository;
import com.rentsphere.repository.AgreementRepository;

@Service
public class InvoiceService extends BaseCrudService<Invoice> {

    private final InvoiceRepository invoiceRepository;
    private final AgreementRepository agreementRepository;

    public InvoiceService(InvoiceRepository invoiceRepository, AgreementRepository agreementRepository) {
        super(invoiceRepository, "Invoice");
        this.invoiceRepository = invoiceRepository;
        this.agreementRepository = agreementRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
    public List<Invoice> findAll() {
        return findAllScoped(invoiceRepository::findByOrganizationId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Invoice> findAll(Pageable pageable) {
        return findAllScoped(pageable, invoiceRepository::findByOrganizationId);
    }

    public List<Invoice> findByTenantId(UUID tenantId) {
        return invoiceRepository.findByTenantId(tenantId);
    }

    @Override
    @Transactional
    public Invoice create(Invoice request) {
        validateAgreement(request);
        return super.create(request);
    }

    @Override
    @Transactional
    public Invoice update(UUID id, Invoice request) {
        validateAgreement(request);
        return super.update(id, request);
    }

    private void validateAgreement(Invoice invoice) {
        if (invoice.getAgreementId() == null) return;
        var agreement = agreementRepository.findById(invoice.getAgreementId())
                .orElseThrow(() -> new ResourceNotFoundException("Agreement", invoice.getAgreementId()));
        if (invoice.getTenantId() != null && !invoice.getTenantId().equals(agreement.getTenantId())) {
            throw new IllegalArgumentException("Invoice tenant must match the selected agreement tenant");
        }
        if (invoice.getOrganizationId() != null && !invoice.getOrganizationId().equals(agreement.getOrganizationId())) {
            throw new IllegalArgumentException("Invoice organization must match the selected agreement organization");
        }
    }

    @Transactional
    @CacheEvict(cacheResolver = "baseCrudCacheResolver", allEntries = true)
    public Invoice markPaid(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        invoice.setStatus(InvoiceStatus.PAID);
        return invoiceRepository.save(invoice);
    }

    @Override
    protected void applyUpdates(Invoice entity, Invoice request) {
        entity.setOrganizationId(request.getOrganizationId());
        entity.setTenantId(request.getTenantId());
        entity.setAgreementId(request.getAgreementId());
        entity.setAmount(request.getAmount());
        entity.setDueDate(request.getDueDate());
        entity.setStatus(request.getStatus());
    }
}
