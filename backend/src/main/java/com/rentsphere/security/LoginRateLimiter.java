package com.rentsphere.security;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final Duration IDLE_TIMEOUT = Duration.ofMinutes(10);

    private static final class BucketEntry {
        final Bucket bucket;
        volatile long lastAccess;

        BucketEntry(Bucket bucket) {
            this.bucket = bucket;
            this.lastAccess = System.currentTimeMillis();
        }
    }

    private final ConcurrentHashMap<String, BucketEntry> buckets = new ConcurrentHashMap<>();

    public boolean isAllowed(HttpServletRequest request) {
        String ip = getClientIp(request);
        BucketEntry entry = buckets.compute(ip, (key, existing) -> {
            BucketEntry current = existing != null ? existing : new BucketEntry(createBucket(key));
            current.lastAccess = System.currentTimeMillis();
            return current;
        });
        return entry.bucket.tryConsume(1);
    }

    public void reset(String ip) {
        buckets.remove(ip);
    }

    @Scheduled(fixedDelay = 5 * 60 * 1000, initialDelay = 5 * 60 * 1000)
    public void cleanupIdleBuckets() {
        long now = System.currentTimeMillis();
        buckets.entrySet().removeIf(entry -> now - entry.getValue().lastAccess > IDLE_TIMEOUT.toMillis());
    }

    private Bucket createBucket(String ip) {
        Bandwidth limit = Bandwidth.classic(MAX_ATTEMPTS, Refill.greedy(MAX_ATTEMPTS, WINDOW));
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xfwd = request.getHeader("X-Forwarded-For");
        if (xfwd != null && !xfwd.isBlank()) {
            return xfwd.split(",")[0].trim();
        }
        String ip = request.getRemoteAddr();
        return ip != null ? ip : "unknown";
    }
}
