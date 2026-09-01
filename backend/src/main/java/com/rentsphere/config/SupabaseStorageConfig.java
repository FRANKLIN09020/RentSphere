package com.rentsphere.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SupabaseStorageConfig {
    @Bean
    SupabaseStorageProperties supabaseStorageProperties(
            @Value("${SUPABASE_URL:}") String url,
            @Value("${SUPABASE_SERVICE_ROLE_KEY:}") String serviceRoleKey,
            @Value("${SUPABASE_STORAGE_BUCKET:rentsphere-images}") String bucket,
            @Value("${SUPABASE_MAX_IMAGE_BYTES:5242880}") long maxFileSizeBytes) {
        return new SupabaseStorageProperties(url, serviceRoleKey, bucket, maxFileSizeBytes);
    }
}
