package com.rentsphere.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.function.BiFunction;
import java.util.function.Function;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.entity.BaseEntity;
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

    protected List<T> findAllScoped(Function<UUID, List<T>> organizationFetcher) {
        if (SecurityUtils.isAdmin()) {
            return repository.findAll();
        }
        UUID organizationId = getCurrentOrganizationId();
        if (organizationId == null) {
            return List.of();
        }
        return organizationFetcher.apply(organizationId);
    }

    protected Page<T> findAllScoped(Pageable pageable, BiFunction<UUID, Pageable, Page<T>> organizationFetcher) {
        if (SecurityUtils.isAdmin()) {
            return repository.findAll(pageable);
        }
        UUID organizationId = getCurrentOrganizationId();
        if (organizationId == null) {
            return Page.empty(pageable);
        }
        return organizationFetcher.apply(organizationId, pageable);
    }

    /**
     * Blocks staff users from reading or mutating records that belong to another
     * organization. Admins are unrestricted and tenants rely on the explicit
     * ownership checks performed by controllers and self-service flows.
     */
    protected void assertAccessible(T entity) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return;
        }
        if (SecurityUtils.isAdmin() || SecurityUtils.isTenant()) {
            return;
        }
        UUID currentOrganizationId = getCurrentOrganizationId();
        if (currentOrganizationId == null) {
            throw new AccessDeniedException("Your account is not linked to an organization");
        }
        UUID entityOrganizationId = extractOrganizationId(entity);
        if (entityOrganizationId != null && !entityOrganizationId.equals(currentOrganizationId)) {
            throw new AccessDeniedException("This record belongs to another organization");
        }
    }

    private UUID extractOrganizationId(T entity) {
        try {
            Object value = entity.getClass().getMethod("getOrganizationId").invoke(entity);
            return value instanceof UUID uuid ? uuid : null;
        } catch (NoSuchMethodException e) {
            return null;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(
                    "Unable to read organizationId from " + entity.getClass().getSimpleName(), e);
        }
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
    @Cacheable(cacheResolver = "baseCrudCacheResolver", key = "T(com.rentsphere.security.SecurityUtils).cacheScopeKey()")
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
        T entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(resourceName, id));
        assertAccessible(entity);
        return entity;
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
        assertAccessible(entity);
        if (!(entity instanceof BaseEntity baseEntity)) {
            throw new IllegalStateException(resourceName + " does not support soft deletion");
        }
        baseEntity.setDeleted(true);
        baseEntity.setDeletedAt(LocalDateTime.now());
        repository.save(entity);
    }

    protected abstract void applyUpdates(T entity, T request);
}
