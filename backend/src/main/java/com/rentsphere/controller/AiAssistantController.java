package com.rentsphere.controller;

import com.rentsphere.dto.AiAssistantRequest;
import com.rentsphere.dto.AiAssistantResponse;
import com.rentsphere.entity.User;
import com.rentsphere.repository.UserRepository;
import com.rentsphere.security.SecurityUtils;
import com.rentsphere.service.GeminiAssistantService;
import com.rentsphere.service.UserPersonalContextService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/assistant")
public class AiAssistantController {

    private final GeminiAssistantService geminiAssistantService;
    private final UserPersonalContextService userPersonalContextService;
    private final UserRepository userRepository;

    public AiAssistantController(GeminiAssistantService geminiAssistantService,
                                 UserPersonalContextService userPersonalContextService,
                                 UserRepository userRepository) {
        this.geminiAssistantService = geminiAssistantService;
        this.userPersonalContextService = userPersonalContextService;
        this.userRepository = userRepository;
    }

    @PostMapping("/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiAssistantResponse> chat(@Valid @RequestBody AiAssistantRequest request) {
        User currentUser = null;
        String username = SecurityUtils.getCurrentUsername();
        if (username != null) {
            currentUser = userRepository.findByEmail(username).orElse(null);
        }
        String personalContext = userPersonalContextService.buildContext(currentUser);
        return ResponseEntity.ok(geminiAssistantService.generateReply(request, personalContext));
    }
}
