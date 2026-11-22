package com.sports.footballbooking.service;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.sports.footballbooking.dto.AuthResponse;
import com.sports.footballbooking.dto.LoginRequest;
import com.sports.footballbooking.dto.RegisterRequest;
import com.sports.footballbooking.dto.UserResponse;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.UserRepository;
import com.sports.footballbooking.security.JwtService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.core.Response;

import java.util.UUID;

@ApplicationScoped
public class AuthService {

    private static final String INVALID_CREDENTIALS_MSG = "Email ou mot de passe incorrect";

    @Inject
    private UserRepository userRepository;

    @Inject
    private JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ClientErrorException("Un compte avec cet email existe déjà", Response.Status.CONFLICT);
        }

        String passwordHash = BCrypt.withDefaults().hashToString(12, req.password().toCharArray());
        String phone = req.phone() != null && !req.phone().isBlank() ? req.phone().trim() : null;

        // Strict rule: role is ALWAYS PLAYER on registration
        User user = new User(
                email,
                passwordHash,
                req.firstName().trim(),
                req.lastName().trim(),
                phone,
                User.Role.PLAYER
        );
        userRepository.persist(user);

        String token = jwtService.generateToken(
                user.getId(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getStatus() != null ? user.getStatus().name() : null,
                user.getEmail()
        );
        return new AuthResponse(token, UserResponse.from(user));
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotAuthorizedException(INVALID_CREDENTIALS_MSG, "Bearer"));

        BCrypt.Result result = BCrypt.verifyer().verify(req.password().toCharArray(), user.getPasswordHash());
        if (!result.verified) {
            throw new NotAuthorizedException(INVALID_CREDENTIALS_MSG, "Bearer");
        }

        if (user.getStatus() != User.Status.ACTIVE) {
            throw new ForbiddenException("Ce compte est " + user.getStatus().name().toLowerCase());
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getStatus() != null ? user.getStatus().name() : null,
                user.getEmail()
        );
        return new AuthResponse(token, UserResponse.from(user));
    }

    public User authenticate(String token) {
        UUID userId = jwtService.validate(token)
                .orElseThrow(() -> new NotAuthorizedException("Bearer"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotAuthorizedException("Bearer"));

        if (user.getStatus() != User.Status.ACTIVE) {
            throw new ForbiddenException("Ce compte est " + user.getStatus().name().toLowerCase());
        }

        return user;
    }
}
