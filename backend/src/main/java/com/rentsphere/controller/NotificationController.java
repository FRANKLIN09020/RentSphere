package com.rentsphere.controller;

import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.rentsphere.dto.NotificationResponse;
import com.rentsphere.security.SecurityUtils;
import com.rentsphere.service.NotificationService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;
    @GetMapping public List<NotificationResponse> list() { return service.findFor(SecurityUtils.getCurrentUsername()); }
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE) public SseEmitter stream() { return service.subscribe(SecurityUtils.getCurrentUsername()); }
    @PutMapping("/{id}/read") public void markRead(@PathVariable UUID id) { service.markRead(SecurityUtils.getCurrentUsername(), id); }
    @PutMapping("/read-all") public void markAllRead() { service.markAllRead(SecurityUtils.getCurrentUsername()); }
}
