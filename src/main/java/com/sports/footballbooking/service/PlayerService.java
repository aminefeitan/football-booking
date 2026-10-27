package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Player;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
@Transactional
public class PlayerService {

    @PersistenceContext(unitName = "footballBookingPU")
    private EntityManager em;

    // ==================== Requête imbriquée ====================

    public static class UpdateProfileRequest {
        public String preferredPosition;
        public String skillLevel;
        public String city;
        public String bio;
        public Boolean available;
    }

    // ==================== Méthodes ====================

    public Player getPlayer(UUID userId) {
        Player player = em.find(Player.class, userId);
        if (player == null) throw new NotFoundException("Player", userId);
        return player;
    }

    /**
     * Backward-compatible alias for getPlayer.
     */
    public Player getOrCreateProfile(UUID userId) {
        return getPlayer(userId);
    }

    public Player updateProfile(UUID userId, UpdateProfileRequest request) {
        Player player = getPlayer(userId);

        if (request.preferredPosition != null) player.setPreferredPosition(request.preferredPosition);
        if (request.skillLevel != null) player.setSkillLevel(request.skillLevel);
        if (request.city != null) player.setCity(request.city);
        if (request.bio != null) player.setBio(request.bio);
        if (request.available != null) player.setAvailable(request.available);

        return em.merge(player);
    }

    public List<Player> searchPlayers(String city) {
        return em.createNamedQuery("Player.findAvailableByCity", Player.class)
                .setParameter("city", city)
                .getResultList();
    }
}
