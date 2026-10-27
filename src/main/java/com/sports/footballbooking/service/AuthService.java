package com.sports.footballbooking.service;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.sports.footballbooking.entity.Admin;
import com.sports.footballbooking.entity.FieldManager;
import com.sports.footballbooking.entity.Player;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

@ApplicationScoped
@Transactional
public class AuthService {

    @PersistenceContext(unitName = "footballBookingPU")
    private EntityManager em;

    // ==================== Requêtes imbriquées ====================

    public static class RegisterRequest {
        @NotBlank @Email public String email;
        @NotBlank public String password;
        @NotBlank public String firstName;
        @NotBlank public String lastName;
        public String phone;
        public User.Role role;
    }

    public static class LoginRequest {
        @NotBlank public String email;
        @NotBlank public String password;
    }

    public static class AuthResponse {
        public String token;
        public User user;
        public AuthResponse(String token, User user) {
            this.token = token;
            this.user = user;
        }
    }

    // ==================== Méthodes ====================

    public AuthResponse register(RegisterRequest request) {
        long count = em.createQuery("SELECT COUNT(u) FROM User u WHERE u.email = :email", Long.class)
                .setParameter("email", request.email)
                .getSingleResult();
        if (count > 0) {
            throw new BusinessException("Un utilisateur avec cet email existe déjà");
        }

        String passwordHash = BCrypt.withDefaults().hashToString(12, request.password.toCharArray());
        User.Role role = request.role != null ? request.role : User.Role.PLAYER;
        User user;

        switch (role) {
            case PLAYER -> user = new Player(request.email, passwordHash, request.firstName, request.lastName);
            case FIELD_MANAGER -> user = new FieldManager(request.email, passwordHash, request.firstName, request.lastName);
            case ADMIN -> user = new Admin(request.email, passwordHash, request.firstName, request.lastName);
            default -> throw new BusinessException("Rôle non supporté: " + role);
        }

        if (request.phone != null) user.setPhone(request.phone);

        em.persist(user);
        em.flush();

        return new AuthResponse("Bearer-" + user.getId(), user);
    }

    public AuthResponse login(LoginRequest request) {
        User user;
        try {
            user = em.createNamedQuery("User.findByEmail", User.class)
                    .setParameter("email", request.email)
                    .getSingleResult();
        } catch (NoResultException e) {
            throw new BusinessException("Email ou mot de passe incorrect");
        }

        if (user.getStatus() == User.Status.BANNED) {
            throw new BusinessException("Ce compte est suspendu");
        }

        BCrypt.Result result = BCrypt.verifyer().verify(request.password.toCharArray(), user.getPasswordHash().toCharArray());
        if (!result.verified) {
            throw new BusinessException("Email ou mot de passe incorrect");
        }

        return new AuthResponse("Bearer-" + user.getId(), user);
    }

    public User getUserById(UUID userId) {
        User user = em.find(User.class, userId);
        if (user == null) throw new NotFoundException("User", userId);
        return user;
    }
}
