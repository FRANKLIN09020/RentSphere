package com.rentsphere.service;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.security.SecurityUtils;

public abstract class BaseCrudService<T> {

    private final JpaRepository<T, UUID> repository;
    private final String resourceName;

    protected BaseCrudService(JpaRepository<T, UUID> repository, String resourceName) {
        this.repository = repository;
        this.resourceName = resourceName;
    }

    protected UUID getCurrentOrganizationId() {
        return SecurityUtils.getCurrentOrganizationId();
    }

    protected boolean isAdmin() {
        return SecurityUtils.isAdmin();
    }

    /**
     * Cache name derived from the resource name, e.g. "Unit" -> "units",
     * "Property" -> "properties", "Deposit dispute" -> "depositDisputes".
     * Must match a cache declared in
     * {@link com.rentsphere.config.CacheConfig}. Services whose resource name
     * does not follow the standard plural rule override this method.
     */
    public String getCacheName() {
        String lower = resourceName.toLowerCase();
        if (lower.endsWith("y")) {
            return lower.substring(0, lower.length() - 1) + "ies";
        }
        return lower + "s";
    }

    @Transactional
    @CacheEvict(cacheResolver = "baseCrudCacheResolver", allEntries = true)
    public T create(T request) {
        return repository.save(request);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver")
    public List<T> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<T> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "#id")
    public T findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(resourceName, id));
    }

    @Transactional
    @CacheEvict(cacheResolver = "baseCrudCacheResolver", allEntries = true)
    public T update(UUID id, T request) {
        T entity = findById(id);
        applyUpdates(entity, request);
        return repository.save(entity);
    }

    @Transactional
    @CacheEvict(cacheResolver = "baseCrudCacheResolver", allEntries = true)
    public void delete(UUID id) {
        T entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(resourceName, id));
        setDeletedField(entity, true);
        setDeletedAtField(entity, LocalDateTime.now());
        repository.save(entity);
    }

    private void setDeletedField(T entity, boolean deleted) {
        try {
            Method setter = entity.getClass().getMethod("setDeleted", boolean.class);
            setter.invoke(entity, deleted);
        } catch (Exception ignored) {
        }
    }

    private void setDeletedAtField(T entity, LocalDateTime deletedAt) {
        try {
            Method setter = entity.getClass().getMethod("setDeletedAt", LocalDateTime.class);
            setter.invoke(entity, deletedAt);
        } catch (Exception ignored) {
        }
    }

    protected abstract void applyUpdates(T entity, T request);
}
