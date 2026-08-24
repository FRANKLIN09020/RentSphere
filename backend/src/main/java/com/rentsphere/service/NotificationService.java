package com.rentsphere.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.rentsphere.dto.NotificationResponse;
import com.rentsphere.entity.Notification;
import com.rentsphere.repository.NotificationRepository;
import com.rentsphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repository;
    private final UserRepository userRepository;
    private final Map<String, Set<SseEmitter>> subscribers = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public List<NotificationResponse> findFor(String email) {
        return repository.findTop50ByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(email).stream().map(this::toResponse).toList();
    }

    @Transactional
    public NotificationResponse notifyUser(UUID organizationId, String email, String title, String detail, String type, String targetPath) {
        if (email == null || email.isBlank()) return null;
        Notification saved = repository.saveAndFlush(Notification.builder().organizationId(organizationId).recipientEmail(email.toLowerCase()).title(title).detail(detail).type(type).targetPath(targetPath).build());
        NotificationResponse response = toResponse(saved);
        emit(email, response);
        return response;
    }

    @Transactional
    public void notifyOrganization(UUID organizationId, String title, String detail, String type, String targetPath) {
        if (organizationId == null) return;
        userRepository.findByOrganizationId(organizationId).forEach(user -> notifyUser(organizationId, user.getEmail(), title, detail, type, targetPath));
    }

    @Transactional
    public void markRead(String email, UUID id) {
        repository.findById(id).filter(item -> item.getRecipientEmail().equalsIgnoreCase(email)).ifPresent(item -> { item.setReadAt(LocalDateTime.now()); repository.save(item); });
    }

    @Transactional
    public void markAllRead(String email) {
        List<Notification> unread = repository.findByRecipientEmailIgnoreCaseAndReadAtIsNull(email);
        LocalDateTime now = LocalDateTime.now();
        unread.forEach(item -> item.setReadAt(now));
        repository.saveAll(unread);
    }

    public SseEmitter subscribe(String email) {
        String key = email.toLowerCase();
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
        subscribers.computeIfAbsent(key, ignored -> ConcurrentHashMap.newKeySet()).add(emitter);
        Runnable remove = () -> {
            Set<SseEmitter> emitters = subscribers.get(key);
            if (emitters != null) emitters.remove(emitter);
        };
        emitter.onCompletion(remove); emitter.onTimeout(remove); emitter.onError(error -> remove.run());
        try { emitter.send(SseEmitter.event().name("connected").data("ok")); } catch (IOException exception) { remove.run(); }
        return emitter;
    }

    private void emit(String email, NotificationResponse response) {
        String key = email.toLowerCase();
        Set<SseEmitter> emitters = subscribers.get(key);
        if (emitters == null) return;
        emitters.removeIf(emitter -> {
            try { emitter.send(SseEmitter.event().name("notification").data(response)); return false; }
            catch (IOException exception) { emitter.complete(); return true; }
        });
    }

    private NotificationResponse toResponse(Notification item) {
        return new NotificationResponse(item.getId(), item.getTitle(), item.getDetail(), item.getType(), item.getTargetPath(), item.getCreatedAt(), item.getReadAt() != null);
    }
}
