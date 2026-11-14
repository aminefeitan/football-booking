package com.sports.footballbooking.service;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.sports.footballbooking.entity.Admin;
import com.sports.footballbooking.entity.FieldManager;
import com.sports.footballbooking.entity.Player;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@Transactional
public class AuthService {

    @Inject
    private UserRepository userRepository;

    @Inject
    private com.sports.footballbooking.config.JwtService jwtService;

    // ==================== DTOs compacts ====================

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank String password,
            @NotBlank String firstName,
            @NotBlank String lastName,
            String phone,
            User.Role role
    ) {}

    public record LoginRequest(
            @NotBlank String email,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String token,
            User user
    ) {}

    // ==================== Méthodes ====================

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Un utilisateur avec cet email existe déjà");
        }

        String passwordHash = BCrypt.withDefaults().hashToString(12, request.password().toCharArray());
        User.Role role = request.role() != null ? request.role() : User.Role.PLAYER;
        User user;

        switch (role) {
            case PLAYER -> user = new Player(request.email(), passwordHash, request.firstName(), request.lastName());
            case FIELD_MANAGER -> user = new FieldManager(request.email(), passwordHash, request.firstName(), request.lastName());
            case ADMIN -> user = new Admin(request.email(), passwordHash, request.firstName(), request.lastName());
            default -> throw new BusinessException("Rôle non supporté: " + role);
        }

        if (request.phone() != null) user.setPhone(request.phone());

        userRepository.save(user);
        userRepository.flush();

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException("Email ou mot de passe incorrect"));

        if (user.getStatus() == User.Status.BANNED) {
            throw new BusinessException("Ce compte est suspendu");
        }

        BCrypt.Result result = BCrypt.verifyer().verify(request.password().toCharArray(), user.getPasswordHash().toCharArray());
        if (!result.verified) {
            throw new BusinessException("Email ou mot de passe incorrect");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user);
    }

    public User getUserById(UUID userId) {
        return userRepository.getById(userId);
    }

    public List<User> getUsersByRole(User.Role role) {
        return userRepository.findByRole(role);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUserStatus(UUID userId, User.Status newStatus) {
        User user = getUserById(userId);
        user.setStatus(newStatus);
        userRepository.save(user);
        return user;
    }

    public UUID resolveUserIdFromToken(String token) {
        if (token == null || token.isBlank()) return null;
        var claims = jwtService.validateToken(token);
        if (claims != null) {
            return claims.userId();
        }
        // Fallback rétro-compatible pour tests
        if (token.startsWith("Bearer-")) {
            try {
                return UUID.fromString(token.substring(7).trim());
            } catch (IllegalArgumentException ignored) {}
        }
        return null;
    }
}
