package com.rentsphere.config;

import java.util.Collection;
import java.util.Collections;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.interceptor.CacheOperationInvocationContext;
import org.springframework.cache.interceptor.CacheResolver;
import org.springframework.stereotype.Component;

import com.rentsphere.service.BaseCrudService;

@Component("baseCrudCacheResolver")
public class BaseCrudCacheResolver implements CacheResolver {

    private final CacheManager cacheManager;

    public BaseCrudCacheResolver(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public Collection<? extends Cache> resolveCaches(CacheOperationInvocationContext<?> context) {
        Object target = context.getTarget();
        if (target instanceof BaseCrudService<?> service) {
            String cacheName = service.getCacheName();
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                return Collections.singletonList(cache);
            }
            throw new IllegalArgumentException(
                    "No cache configured for resource '" + cacheName
                            + "'. Declare it in CacheConfig."
            );
        }
        throw new IllegalArgumentException(
                "Unsupported target for dynamic cache resolution: " + target.getClass().getName()
        );
    }
}
