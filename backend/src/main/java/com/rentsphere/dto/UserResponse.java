package com.rentsphere.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import com.rentsphere.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private UUID organizationId;
    private String name;
    private String email;
    private UserRole role;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
