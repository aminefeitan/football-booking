package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.PlayerProfile;
import com.sports.footballbooking.entity.User;
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

    public PlayerProfile getOrCreateProfile(UUID userId) {
        User user = em.find(User.class, userId);
        if (user == null) throw new NotFoundException("User", userId);

        List<PlayerProfile> results = em.createNamedQuery("PlayerProfile.findByUserId", PlayerProfile.class)
                .setParameter("userId", userId)
                .getResultList();

        if (!results.isEmpty()) return results.get(0);

        PlayerProfile profile = new PlayerProfile(user);
        em.persist(profile);
        return profile;
    }

    public PlayerProfile updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = em.find(User.class, userId);
        if (user == null) throw new NotFoundException("User", userId);

        List<PlayerProfile> results = em.createNamedQuery("PlayerProfile.findByUserId", PlayerProfile.class)
                .setParameter("userId", userId)
                .getResultList();

        PlayerProfile profile = results.isEmpty() ? new PlayerProfile(user) : results.get(0);

        if (request.preferredPosition != null) profile.setPreferredPosition(request.preferredPosition);
        if (request.skillLevel != null) profile.setSkillLevel(request.skillLevel);
        if (request.city != null) profile.setCity(request.city);
        if (request.bio != null) profile.setBio(request.bio);
        if (request.available != null) profile.setAvailable(request.available);

        if (profile.getId() == null) {
            em.persist(profile);
        } else {
            profile = em.merge(profile);
        }
        return profile;
    }

    public List<PlayerProfile> searchPlayers(String city) {
        return em.createNamedQuery("PlayerProfile.findAvailableByCity", PlayerProfile.class)
                .setParameter("city", city)
                .getResultList();
    }
}
