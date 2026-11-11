package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.Match;
import com.sports.footballbooking.entity.MatchParticipant;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.repository.BookingRepository;
import com.sports.footballbooking.repository.FieldRepository;
import com.sports.footballbooking.repository.MatchRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
@Transactional
public class MatchService {

    @Inject
    private MatchRepository matchRepository;

    @Inject
    private FieldRepository fieldRepository;

    @Inject
    private BookingRepository bookingRepository;

    @Inject
    private UserRepository userRepository;

    // ==================== DTOs compacts ====================

    public record CreateMatchRequest(
            @NotBlank String title,
            String description,
            @NotNull OffsetDateTime matchDate,
            int durationMinutes,
            Integer maxPlayers,
            boolean isPublic,
            String city,
            UUID fieldId,
            UUID bookingId
    ) {
        public CreateMatchRequest(String title, OffsetDateTime matchDate) {
            this(title, null, matchDate, 60, null, true, null, null, null);
        }
    }

    public record JoinMatchRequest(
            String teamSide
    ) {
        public JoinMatchRequest() {
            this("A");
        }
    }

    // ==================== Méthodes ====================

    public Match createMatch(UUID organizerId, CreateMatchRequest req) {
        User organizer = userRepository.getById(organizerId);

        int duration = req.durationMinutes() > 0 ? req.durationMinutes() : 60;
        Match match = new Match(organizer, req.title(), req.matchDate(), duration);
        match.setDescription(req.description());
        match.setMaxPlayers(req.maxPlayers());
        match.setPublic(req.isPublic());
        match.setCity(req.city());

        if (req.fieldId() != null) {
            Field field = fieldRepository.getById(req.fieldId());
            match.setField(field);
            if (match.getCity() == null) match.setCity(field.getCity());
        }

        if (req.bookingId() != null) {
            Booking booking = bookingRepository.getById(req.bookingId());
            match.setBooking(booking);
        }

        match = matchRepository.save(match);
        matchRepository.flush();

        // L'organisateur est automatiquement participant côté A
        MatchParticipant organizerPart = new MatchParticipant(match, organizer, "A");
        organizerPart.setStatus("CONFIRMED");
        matchRepository.persistParticipant(organizerPart);

        return getMatchById(match.getId());
    }

    public Match getMatchById(UUID matchId) {
        Match match = matchRepository.getById(matchId);
        match.setParticipants(matchRepository.findParticipants(matchId));
        return match;
    }

    public List<Match> listUpcomingMatches(String city) {
        List<Match> matches = matchRepository.findUpcoming(city);
        matches.forEach(m -> m.setParticipants(matchRepository.findParticipants(m.getId())));
        return matches;
    }

    public MatchParticipant joinMatch(UUID matchId, UUID userId, JoinMatchRequest req) {
        Match match = matchRepository.getById(matchId);
        if (!"OPEN".equalsIgnoreCase(match.getStatus())) {
            throw new BusinessException("Ce match n'est pas ouvert aux inscriptions (statut: " + match.getStatus() + ")");
        }

        User user = userRepository.getById(userId);

        if (matchRepository.isParticipant(matchId, userId)) {
            throw new BusinessException("Vous êtes déjà inscrit à ce match");
        }

        List<MatchParticipant> current = matchRepository.findParticipants(matchId);
        if (match.getMaxPlayers() != null && current.size() >= match.getMaxPlayers()) {
            match.setStatus("FULL");
            matchRepository.save(match);
            throw new BusinessException("Ce match est complet");
        }

        String teamSide = (req != null && req.teamSide() != null) ? req.teamSide() : "A";
        MatchParticipant participant = new MatchParticipant(match, user, teamSide);
        matchRepository.persistParticipant(participant);

        if (match.getMaxPlayers() != null && (current.size() + 1) >= match.getMaxPlayers()) {
            match.setStatus("FULL");
            matchRepository.save(match);
        }

        return participant;
    }

    public void leaveMatch(UUID matchId, UUID userId) {
        matchRepository.removeParticipant(matchId, userId);

        Match match = matchRepository.findById(matchId).orElse(null);
        if (match != null && "FULL".equalsIgnoreCase(match.getStatus())) {
            match.setStatus("OPEN");
            matchRepository.save(match);
        }
    }

    public Match cancelMatch(UUID matchId, UUID userId) {
        Match match = matchRepository.getById(matchId);
        if (!match.getOrganizer().getId().equals(userId)) {
            throw new BusinessException("Seul l'organisateur peut annuler ce match");
        }
        match.setStatus("CANCELLED");
        matchRepository.save(match);
        return getMatchById(match.getId());
    }
}
