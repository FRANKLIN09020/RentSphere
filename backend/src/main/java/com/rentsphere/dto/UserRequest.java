package com.rentsphere.dto;

import java.util.UUID;
import com.rentsphere.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {
    private UUID organizationId;
    @NotBlank
    private String name;
    @Email
    @NotBlank
    private String email;
    private String password;
    private UserRole role;
    private String phone;
}
