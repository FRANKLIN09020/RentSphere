package com.rentsphere.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage.supabase")
public record SupabaseStorageProperties(String url, String serviceRoleKey, String bucket, long maxFileSizeBytes) {
    public SupabaseStorageProperties {
        bucket = bucket == null || bucket.isBlank() ? "rentsphere-images" : bucket;
        maxFileSizeBytes = maxFileSizeBytes <= 0 ? 5 * 1024 * 1024 : maxFileSizeBytes;
    }

    public boolean isConfigured() {
        return url != null && !url.isBlank() && serviceRoleKey != null && !serviceRoleKey.isBlank();
    }
}
