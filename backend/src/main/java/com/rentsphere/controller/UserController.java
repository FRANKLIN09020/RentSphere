package com.rentsphere.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.rentsphere.dto.DtoMapper;
import com.rentsphere.dto.UserRequest;
import com.rentsphere.dto.UserResponse;
import com.rentsphere.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return DtoMapper.toResponseList(userService.findAll(), DtoMapper::toResponse);
    }

    @GetMapping("/paged")
    public Page<UserResponse> getPagedUsers(@PageableDefault(size = 20) Pageable pageable) {
        return userService.findAll(pageable).map(DtoMapper::toResponse);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody UserRequest request) {
        var entity = userService.create(DtoMapper.toEntity(request));
        return DtoMapper.toResponse(entity);
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable UUID id) {
        return DtoMapper.toResponse(userService.findById(id));
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(@PathVariable UUID id, @Valid @RequestBody UserRequest request) {
        var entity = userService.findById(id);
        DtoMapper.updateEntity(entity, request);
        return DtoMapper.toResponse(userService.update(id, entity));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable UUID id) {
        userService.delete(id);
    }
}
