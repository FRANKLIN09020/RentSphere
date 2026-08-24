package com.rentsphere.service;

import org.springframework.stereotype.Service;

import com.rentsphere.entity.Tenant;
import com.rentsphere.entity.User;
import com.rentsphere.exception.ResourceNotFoundException;
import com.rentsphere.security.SecurityUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CurrentTenantService {

    private final UserService userService;
    private final TenantService tenantService;

    public Tenant getCurrentTenant() {
        String email = SecurityUtils.getCurrentUsername();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
        return tenantService.findOrCreateForUser(user);
    }
}
