package com.sports.footballbooking.service;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.sports.footballbooking.dto.CreateFieldManagerRequest;
import com.sports.footballbooking.dto.CreatedUserResponse;
import com.sports.footballbooking.dto.UpdatePasswordRequest;
import com.sports.footballbooking.dto.UpdateProfileRequest;
import com.sports.footballbooking.dto.UserResponse;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class UserService {

    private static final String TEMP_PWD_ALPHABET = "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Inject
    private UserRepository userRepository;

    public UserResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        user.setFirstName(req.firstName().trim());
        user.setLastName(req.lastName().trim());
        user.setPhone(req.phone() != null && !req.phone().isBlank() ? req.phone().trim() : null);

        return UserResponse.from(user);
    }

    @Transactional
    public void updatePassword(UUID userId, UpdatePasswordRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        if (req.currentPassword().equals(req.newPassword())) {
            throw new BadRequestException("Le nouveau mot de passe doit être différent de l'actuel");
        }

        BCrypt.Result result = BCrypt.verifyer().verify(req.currentPassword().toCharArray(), user.getPasswordHash());
        if (!result.verified) {
            throw new BadRequestException("Mot de passe actuel incorrect");
        }

        String newHash = BCrypt.withDefaults().hashToString(12, req.newPassword().toCharArray());
        user.setPasswordHash(newHash);
        user.setMustChangePassword(false);
    }

    public List<UserResponse> listUsers(User.Role role) {
        return userRepository.findByRole(role).stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public CreatedUserResponse createFieldManager(CreateFieldManagerRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ClientErrorException("Un compte avec cet email existe déjà", Response.Status.CONFLICT);
        }

        String tempPassword = generateTemporaryPassword();
        String passwordHash = BCrypt.withDefaults().hashToString(12, tempPassword.toCharArray());

        User user = new User(
                email,
                passwordHash,
                req.firstName().trim(),
                req.lastName().trim(),
                req.phone() != null && !req.phone().isBlank() ? req.phone().trim() : null,
                User.Role.FIELD_MANAGER
        );
        user.setStatus(User.Status.ACTIVE);
        user.setMustChangePassword(true);

        userRepository.persist(user);

        return new CreatedUserResponse(UserResponse.from(user), tempPassword);
    }

    @Transactional
    public CreatedUserResponse resetPassword(UUID adminId, UUID targetUserId) {
        if (adminId.equals(targetUserId)) {
            throw new ForbiddenException("Impossible de réinitialiser son propre mot de passe");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        if (targetUser.getRole() == User.Role.ADMIN) {
            throw new ForbiddenException("Impossible de réinitialiser le mot de passe d'un administrateur");
        }

        String tempPassword = generateTemporaryPassword();
        String passwordHash = BCrypt.withDefaults().hashToString(12, tempPassword.toCharArray());

        targetUser.setPasswordHash(passwordHash);
        targetUser.setMustChangePassword(true);

        return new CreatedUserResponse(UserResponse.from(targetUser), tempPassword);
    }

    @Transactional
    public UserResponse updateUserStatus(UUID adminId, UUID targetUserId, User.Status newStatus) {
        if (adminId.equals(targetUserId)) {
            throw new ForbiddenException("Impossible de modifier son propre statut");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new ForbiddenException("Impossible de modifier le statut d'un administrateur");
        }

        user.setStatus(newStatus);
        return UserResponse.from(user);
    }

    public static String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(14);
        for (int i = 0; i < 14; i++) {
            sb.append(TEMP_PWD_ALPHABET.charAt(RANDOM.nextInt(TEMP_PWD_ALPHABET.length())));
        }
        return sb.toString();
    }
}

