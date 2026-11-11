package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Player;
import com.sports.footballbooking.repository.PlayerRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@Transactional
public class PlayerService {

    @Inject
    private PlayerRepository playerRepository;

    // ==================== DTO compact ====================

    public record UpdateProfileRequest(
            String preferredPosition,
            String skillLevel,
            String city,
            String bio,
            Boolean available
    ) {}

    // ==================== Méthodes ====================

    public Player getPlayer(UUID userId) {
        return playerRepository.getById(userId);
    }

    public Player getOrCreateProfile(UUID userId) {
        return getPlayer(userId);
    }

    public Player updateProfile(UUID userId, UpdateProfileRequest req) {
        Player player = getPlayer(userId);

        if (req.preferredPosition() != null) player.setPreferredPosition(req.preferredPosition());
        if (req.skillLevel() != null) player.setSkillLevel(req.skillLevel());
        if (req.city() != null) player.setCity(req.city());
        if (req.bio() != null) player.setBio(req.bio());
        if (req.available() != null) player.setAvailable(req.available());

        return playerRepository.save(player);
    }

    public List<Player> searchPlayers(String city) {
        return playerRepository.search(city, false);
    }

    public List<Player> searchAvailablePlayers(String city) {
        return playerRepository.search(city, true);
    }
}
