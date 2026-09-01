package com.rentsphere.service;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import com.rentsphere.config.SupabaseStorageProperties;
import com.rentsphere.dto.ImageUploadResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SupabaseStorageService {
    private static final Set<String> ALLOWED_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, "image/webp", "image/gif");

    private final SupabaseStorageProperties properties;
    private final RestClient.Builder restClientBuilder;

    public ImageUploadResponse uploadImage(MultipartFile file) {
        validate(file);
        String objectPath = "uploads/" + UUID.randomUUID() + extensionFor(file.getContentType());
        String baseUrl = properties.url().replaceAll("/+$", "");
        String storagePath = encodeSegment(properties.bucket()) + "/" + encodePath(objectPath);

        restClientBuilder.build().post()
                .uri(URI.create(baseUrl + "/storage/v1/object/" + storagePath))
                .header("apikey", properties.serviceRoleKey())
                .header("Authorization", "Bearer " + properties.serviceRoleKey())
                .header("x-upsert", "false")
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .body(readBytes(file))
                .retrieve()
                .toBodilessEntity();

        return new ImageUploadResponse(
                baseUrl + "/storage/v1/object/public/" + storagePath,
                objectPath);
    }

    private void validate(MultipartFile file) {
        if (!properties.isConfigured()) throw new IllegalStateException("Supabase Storage is not configured");
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Choose a non-empty image file");
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.contains(type)) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP, and GIF images are supported");
        }
        if (file.getSize() > properties.maxFileSizeBytes()) {
            throw new IllegalArgumentException("Image must be 5 MB or smaller");
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (java.io.IOException exception) {
            throw new IllegalArgumentException("Could not read the image file", exception);
        }
    }

    private String extensionFor(String contentType) {
        return switch (contentType == null ? "" : contentType.toLowerCase(Locale.ROOT)) {
            case MediaType.IMAGE_JPEG_VALUE -> ".jpg";
            case MediaType.IMAGE_PNG_VALUE -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> "";
        };
    }

    private String encodePath(String path) {
        return String.join("/", Arrays.stream(path.split("/")).map(this::encodeSegment).toList());
    }

    private String encodeSegment(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
