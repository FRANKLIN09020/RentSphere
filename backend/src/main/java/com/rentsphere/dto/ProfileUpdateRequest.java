package com.rentsphere.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequest {

    @Size(min = 1, max = 120, message = "Name must be between 1 and 120 characters")
    private String name;

    @Size(max = 40, message = "Phone must not exceed 40 characters")
    private String phone;
}