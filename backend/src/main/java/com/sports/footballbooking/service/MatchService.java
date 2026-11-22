package com.sports.footballbooking.service;

import com.sports.footballbooking.dto.CreateMatchRequest;
import com.sports.footballbooking.dto.MatchResponse;
import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Match;
import com.sports.footballbooking.entity.Team;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class MatchService {

    @Inject
    private MatchRepository matchRepository;

    @Inject
    private TeamRepository teamRepository;

    @Inject
    private TeamMemberRepository teamMemberRepository;

    @Inject
    private UserRepository userRepository;

    @Inject
    private BookingRepository bookingRepository;

    @Transactional
    public MatchResponse createMatch(UUID callerId, CreateMatchRequest req) {
        if (req.homeTeamId().equals(req.awayTeamId())) {
            throw new BadRequestException("L'équipe à domicile et l'équipe adverse doivent être distinctes");
        }

        if (req.durationMinutes() < 30 || req.durationMinutes() > 240) {
            throw new BadRequestException("La durée d'un match doit être comprise entre 30 et 240 minutes");
        }

        if (!req.startAt().isAfter(OffsetDateTime.now())) {
            throw new BadRequestException("La date de début du match doit être dans le futur");
        }

        // Caller must be captain of homeTeam
        if (!teamMemberRepository.isCaptain(req.homeTeamId(), callerId)) {
            throw new ForbiddenException("Seul le capitaine de l'équipe à domicile peut créer le match");
        }

        User creator = userRepository.findById(callerId)
                .orElseThrow(() -> new NotFoundException("Joueur introuvable"));

        Team homeTeam = teamRepository.findById(req.homeTeamId())
                .orElseThrow(() -> new NotFoundException("Équipe à domicile introuvable"));

        Team awayTeam = teamRepository.findById(req.awayTeamId())
                .orElseThrow(() -> new NotFoundException("Équipe adverse introuvable"));

        Match match = new Match(creator, homeTeam, awayTeam, req.startAt(), req.durationMinutes());
        matchRepository.persist(match);

        return MatchResponse.from(match);
    }

    public List<MatchResponse> getMyMatches(UUID userId, Integer page, Integer size) {
        return matchRepository.findByUserId(userId, page, size).stream()
                .map(MatchResponse::from)
                .toList();
    }

    public List<MatchResponse> getMyMatches(UUID userId) {
        return getMyMatches(userId, null, null);
    }

    public MatchResponse getMatchDetails(UUID matchId, UUID userId, boolean isAdmin) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new NotFoundException("Match introuvable"));

        if (!isAdmin) {
            boolean isCreator = match.getCreator().getId().equals(userId);
            boolean inHomeTeam = teamMemberRepository.isMember(match.getHomeTeam().getId(), userId);
            boolean inAwayTeam = teamMemberRepository.isMember(match.getAwayTeam().getId(), userId);

            boolean isFieldOwner = false;
            Optional<Booking> activeBooking = bookingRepository.findActiveByMatch(matchId);
            if (activeBooking.isPresent()) {
                isFieldOwner = activeBooking.get().getField().getOwner().getId().equals(userId);
            }

            if (!isCreator && !inHomeTeam && !inAwayTeam && !isFieldOwner) {
                throw new NotFoundException("Match introuvable");
            }
        }

        return MatchResponse.from(match);
    }

    @Transactional
    public void cancelMatch(UUID matchId, UUID userId, boolean isAdmin) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new NotFoundException("Match introuvable"));

        boolean isCreator = match.getCreator().getId().equals(userId);
        if (!isCreator && !isAdmin) {
            throw new ForbiddenException("Seul le créateur du match ou un administrateur peut annuler ce match");
        }

        match.setStatus(Match.MatchStatus.CANCELLED);

        // Cancel associated active booking in the same transaction
        Optional<Booking> activeBooking = bookingRepository.findActiveByMatch(matchId);
        if (activeBooking.isPresent()) {
            Booking b = activeBooking.get();
            b.setStatus(Booking.BookingStatus.CANCELLED);
            b.setCancelledAt(OffsetDateTime.now());
            b.setReason("Annulation du match associé");
        }
    }
}
