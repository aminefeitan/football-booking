package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.Match;
import com.sports.footballbooking.entity.MatchParticipant;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
@Transactional
public class MatchService {

    @PersistenceContext(unitName = "footballBookingPU")
    private EntityManager em;

    // ==================== Requêtes imbriquées ====================

    public static class CreateMatchRequest {
        @NotBlank public String title;
        public String description;
        @NotNull public OffsetDateTime matchDate;
        public int durationMinutes = 60;
        public Integer maxPlayers;
        public boolean isPublic = true;
        public String city;
        public UUID fieldId;
        public UUID bookingId;
    }

    public static class JoinMatchRequest {
        public String teamSide = "A";
    }

    // ==================== Méthodes ====================

    public Match createMatch(UUID organizerId, CreateMatchRequest request) {
        User organizer = em.find(User.class, organizerId);
        if (organizer == null) throw new NotFoundException("User", organizerId);

        Match match = new Match(organizer, request.title, request.matchDate, request.durationMinutes);
        match.setDescription(request.description);
        match.setMaxPlayers(request.maxPlayers);
        match.setPublic(request.isPublic);
        match.setCity(request.city);

        if (request.fieldId != null) {
            Field field = em.find(Field.class, request.fieldId);
            if (field == null) throw new NotFoundException("Field", request.fieldId);
            match.setField(field);
            if (match.getCity() == null) match.setCity(field.getCity());
        }

        if (request.bookingId != null) {
            Booking booking = em.find(Booking.class, request.bookingId);
            if (booking == null) throw new NotFoundException("Booking", request.bookingId);
            match.setBooking(booking);
        }

        em.persist(match);
        em.flush();

        // L'organisateur est automatiquement participant côté A
        MatchParticipant organizerPart = new MatchParticipant(match, organizer, "A");
        organizerPart.setStatus("CONFIRMED");
        em.persist(organizerPart);

        return getMatchById(match.getId());
    }

    public Match getMatchById(UUID matchId) {
        Match match = em.find(Match.class, matchId);
        if (match == null) throw new NotFoundException("Match", matchId);
        List<MatchParticipant> participants = em.createNamedQuery("MatchParticipant.findByMatch", MatchParticipant.class)
                .setParameter("matchId", matchId)
                .getResultList();
        match.setParticipants(participants);
        return match;
    }

    public List<Match> listUpcomingMatches(String city) {
        List<Match> matches;
        if (city != null && !city.isBlank()) {
            matches = em.createNamedQuery("Match.findByCity", Match.class)
                    .setParameter("city", city)
                    .setParameter("now", OffsetDateTime.now())
                    .getResultList();
        } else {
            matches = em.createNamedQuery("Match.findPublicUpcoming", Match.class)
                    .setParameter("now", OffsetDateTime.now())
                    .getResultList();
        }
        matches.forEach(m -> m.setParticipants(
                em.createNamedQuery("MatchParticipant.findByMatch", MatchParticipant.class)
                        .setParameter("matchId", m.getId())
                        .getResultList()
        ));
        return matches;
    }

    public MatchParticipant joinMatch(UUID matchId, UUID userId, JoinMatchRequest request) {
        Match match = em.find(Match.class, matchId);
        if (match == null) throw new NotFoundException("Match", matchId);
        if (!"OPEN".equalsIgnoreCase(match.getStatus())) {
            throw new BusinessException("Ce match n'est pas ouvert aux inscriptions (statut: " + match.getStatus() + ")");
        }

        User user = em.find(User.class, userId);
        if (user == null) throw new NotFoundException("User", userId);

        boolean alreadyJoined = !em.createNamedQuery("MatchParticipant.findByMatchAndUser", MatchParticipant.class)
                .setParameter("matchId", matchId)
                .setParameter("userId", userId)
                .getResultList().isEmpty();
        if (alreadyJoined) throw new BusinessException("Vous êtes déjà inscrit à ce match");

        List<MatchParticipant> current = em.createNamedQuery("MatchParticipant.findByMatch", MatchParticipant.class)
                .setParameter("matchId", matchId)
                .getResultList();
        if (match.getMaxPlayers() != null && current.size() >= match.getMaxPlayers()) {
            match.setStatus("FULL");
            em.merge(match);
            throw new BusinessException("Ce match est complet");
        }

        String teamSide = (request != null && request.teamSide != null) ? request.teamSide : "A";
        MatchParticipant participant = new MatchParticipant(match, user, teamSide);
        em.persist(participant);

        if (match.getMaxPlayers() != null && (current.size() + 1) >= match.getMaxPlayers()) {
            match.setStatus("FULL");
            em.merge(match);
        }

        return participant;
    }

    public void leaveMatch(UUID matchId, UUID userId) {
        List<MatchParticipant> result = em.createNamedQuery("MatchParticipant.findByMatchAndUser", MatchParticipant.class)
                .setParameter("matchId", matchId)
                .setParameter("userId", userId)
                .getResultList();
        if (result.isEmpty()) throw new NotFoundException("Participant introuvable pour ce match");
        em.remove(result.get(0));

        Match match = em.find(Match.class, matchId);
        if (match != null && "FULL".equalsIgnoreCase(match.getStatus())) {
            match.setStatus("OPEN");
            em.merge(match);
        }
    }

    public Match cancelMatch(UUID matchId, UUID userId) {
        Match match = em.find(Match.class, matchId);
        if (match == null) throw new NotFoundException("Match", matchId);
        if (!match.getOrganizer().getId().equals(userId)) {
            throw new BusinessException("Seul l'organisateur peut annuler ce match");
        }
        match.setStatus("CANCELLED");
        em.merge(match);
        return getMatchById(match.getId());
    }
}
