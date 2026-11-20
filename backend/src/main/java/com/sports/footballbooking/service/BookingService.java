package com.sports.footballbooking.service;

import com.sports.footballbooking.dto.BookingResponse;
import com.sports.footballbooking.dto.CreateBookingRequest;
import com.sports.footballbooking.dto.RejectBookingRequest;
import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.Match;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.BookingRepository;
import com.sports.footballbooking.repository.FieldRepository;
import com.sports.footballbooking.repository.MatchRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class BookingService {

    public static final int MAX_PENDING_BOOKINGS = 5;

    @Inject
    private BookingRepository bookingRepository;

    @Inject
    private FieldRepository fieldRepository;

    @Inject
    private MatchRepository matchRepository;

    @Inject
    private UserRepository userRepository;

    @Transactional
    public BookingResponse createBooking(UUID callerId, CreateBookingRequest req) {
        User user = userRepository.findById(callerId)
                .orElseThrow(() -> new NotFoundException("Joueur introuvable"));

        if (user.getRole() != User.Role.PLAYER) {
            throw new ForbiddenException("Seuls les joueurs peuvent effectuer des réservations");
        }

        Match match = matchRepository.findById(req.matchId())
                .orElseThrow(() -> new NotFoundException("Match introuvable"));

        // Match creator check
        if (!match.getCreator().getId().equals(callerId)) {
            throw new ForbiddenException("Seul le créateur du match peut effectuer la réservation");
        }

        if (match.getStatus() != Match.MatchStatus.PLANNED) {
            throw new ClientErrorException("Le match n'est pas au statut prévu (PLANNED)", Response.Status.CONFLICT);
        }

        if (!match.getStartAt().isAfter(OffsetDateTime.now())) {
            throw new BadRequestException("Impossible de réserver pour un match passé");
        }

        // Active booking already exists for this match
        if (bookingRepository.findActiveByMatch(req.matchId()).isPresent()) {
            throw new ClientErrorException("Une réservation active existe déjà pour ce match", Response.Status.CONFLICT);
        }

        // Anti-blocking max pending per player
        long pendingCount = bookingRepository.countPendingByUser(callerId);
        if (pendingCount >= MAX_PENDING_BOOKINGS) {
            throw new ClientErrorException("Limite maximale de " + MAX_PENDING_BOOKINGS + " réservations en attente atteinte", Response.Status.CONFLICT);
        }

        // Pessimistic lock on Field
        Field field = fieldRepository.findByIdForUpdate(req.fieldId())
                .orElseThrow(() -> new NotFoundException("Terrain introuvable"));

        if (field.getStatus() != Field.FieldStatus.APPROVED) {
            throw new ClientErrorException("Ce terrain n'est pas approuvé pour les réservations", Response.Status.CONFLICT);
        }

        OffsetDateTime startAt = match.getStartAt();
        OffsetDateTime endAt = startAt.plusMinutes(match.getDurationMinutes());

        // Working hours verification in ZONE
        ZonedDateTime startZoned = startAt.atZoneSameInstant(FieldService.ZONE);
        ZonedDateTime endZoned = endAt.atZoneSameInstant(FieldService.ZONE);

        if (!startZoned.toLocalDate().equals(endZoned.toLocalDate())) {
            throw new BadRequestException("La réservation doit se dérouler sur une seule journée locale");
        }

        LocalTime openTime = field.getOpenTime();
        LocalTime closeTime = field.getCloseTime();
        LocalTime startTime = startZoned.toLocalTime();
        LocalTime endTime = endZoned.toLocalTime();

        if (startTime.isBefore(openTime) || endTime.isAfter(closeTime)) {
            throw new BadRequestException("Le créneau demandé est en dehors des horaires d'ouverture du terrain");
        }

        // Overlap check
        if (bookingRepository.existsOverlapping(req.fieldId(), startAt, endAt)) {
            throw new ClientErrorException("Le terrain est déjà réservé sur ce créneau", Response.Status.CONFLICT);
        }

        // Price calculation: pricePerHour * minutes / 60
        BigDecimal minutes = BigDecimal.valueOf(match.getDurationMinutes());
        BigDecimal totalAmount = field.getPricePerHour()
                .multiply(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        Booking booking = new Booking(match, user, field, startAt, endAt, totalAmount,
                req.notes() != null ? req.notes().trim() : null);

        bookingRepository.persist(booking);

        return BookingResponse.from(booking);
    }

    public List<BookingResponse> getMyBookings(UUID userId) {
        return bookingRepository.findByUser(userId).stream()
                .map(BookingResponse::from)
                .toList();
    }

    public List<BookingResponse> getManagerBookings(UUID managerId, Booking.BookingStatus status) {
        return bookingRepository.findByManager(managerId, status).stream()
                .map(BookingResponse::from)
                .toList();
    }

    public BookingResponse getBookingDetails(UUID bookingId, UUID callerId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Réservation introuvable"));

        if (!isAdmin) {
            boolean isPlayer = booking.getUser().getId().equals(callerId);
            boolean isOwner = booking.getField().getOwner().getId().equals(callerId);
            if (!isPlayer && !isOwner) {
                throw new NotFoundException("Réservation introuvable");
            }
        }

        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse confirmBooking(UUID bookingId, UUID callerId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Réservation introuvable"));

        boolean isOwner = booking.getField().getOwner().getId().equals(callerId);
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Seul le gérant du terrain ou un administrateur peut confirmer cette réservation");
        }

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new ClientErrorException("Seule une réservation en attente peut être confirmée", Response.Status.CONFLICT);
        }

        User handler = userRepository.findById(callerId)
                .orElseThrow(() -> new NotFoundException("Gestionnaire introuvable"));

        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setHandledBy(handler);
        booking.setHandledAt(OffsetDateTime.now());

        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse rejectBooking(UUID bookingId, UUID callerId, boolean isAdmin, RejectBookingRequest req) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Réservation introuvable"));

        boolean isOwner = booking.getField().getOwner().getId().equals(callerId);
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Seul le gérant du terrain ou un administrateur peut refuser cette réservation");
        }

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new ClientErrorException("Seule une réservation en attente peut être refusée", Response.Status.CONFLICT);
        }

        User handler = userRepository.findById(callerId)
                .orElseThrow(() -> new NotFoundException("Gestionnaire introuvable"));

        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking.setHandledBy(handler);
        booking.setHandledAt(OffsetDateTime.now());
        booking.setReason(req.reason().trim());

        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(UUID bookingId, UUID callerId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Réservation introuvable"));

        boolean isPlayer = booking.getUser().getId().equals(callerId);
        boolean isOwner = booking.getField().getOwner().getId().equals(callerId);
        if (!isPlayer && !isOwner && !isAdmin) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à annuler cette réservation");
        }

        if (booking.getStatus() != Booking.BookingStatus.PENDING && booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new ClientErrorException("Cette réservation ne peut plus être annulée", Response.Status.CONFLICT);
        }

        if (!booking.getStartAt().isAfter(OffsetDateTime.now())) {
            throw new ClientErrorException("Impossible d'annuler une réservation déjà passée ou commencée", Response.Status.CONFLICT);
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelledAt(OffsetDateTime.now());
        booking.setReason("Annulation par l'utilisateur ou le gestionnaire");

        return BookingResponse.from(booking);
    }
}
