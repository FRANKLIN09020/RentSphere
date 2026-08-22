package com.rentsphere.service;

import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.entity.Invoice;
import com.rentsphere.entity.InvoiceStatus;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.repository.InvoiceRepository;

@Service
public class InvoiceService extends BaseCrudService<Invoice> {

    private final InvoiceRepository invoiceRepository;

    public InvoiceService(InvoiceRepository invoiceRepository) {
        super(invoiceRepository, "Invoice");
        this.invoiceRepository = invoiceRepository;
    }

    public List<Invoice> findByTenantId(UUID tenantId) {
        return invoiceRepository.findByTenantId(tenantId);
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
