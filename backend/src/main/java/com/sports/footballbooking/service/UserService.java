package com.sports.footballbooking.service;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.sports.footballbooking.dto.UpdatePasswordRequest;
import com.sports.footballbooking.dto.UpdateProfileRequest;
import com.sports.footballbooking.dto.UserResponse;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class UserService {

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

        BCrypt.Result result = BCrypt.verifyer().verify(req.currentPassword().toCharArray(), user.getPasswordHash());
        if (!result.verified) {
            throw new BadRequestException("Mot de passe actuel incorrect");
        }

        String newHash = BCrypt.withDefaults().hashToString(12, req.newPassword().toCharArray());
        user.setPasswordHash(newHash);
    }

    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse updateUserStatus(UUID adminId, UUID targetUserId, User.Status newStatus) {
        if (adminId.equals(targetUserId)) {
            throw new ForbiddenException("Impossible de modifier son propre statut");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        user.setStatus(newStatus);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateUserRole(UUID adminId, UUID targetUserId, User.Role newRole) {
        if (adminId.equals(targetUserId)) {
            throw new ForbiddenException("Impossible de modifier son propre rôle");
        }
        if (newRole == User.Role.ADMIN) {
            throw new BadRequestException("Attribution du rôle ADMIN interdite via cette action");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new NotFoundException("Utilisateur introuvable"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new ForbiddenException("Impossible de modifier le rôle d'un administrateur");
        }

        user.setRole(newRole);
        return UserResponse.from(user);
    }
}
