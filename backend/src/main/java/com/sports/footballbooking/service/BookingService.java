package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.repository.BookingRepository;
import com.sports.footballbooking.repository.FieldRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;

@ApplicationScoped
@Transactional
public class BookingService {

    private static final Logger LOG = Logger.getLogger(BookingService.class.getName());
    private static final int MAX_BOOKING_HOURS = 4;
    private static final int MIN_BOOKING_MINUTES = 30;

    @Inject
    private BookingRepository bookingRepository;

    @Inject
    private FieldRepository fieldRepository;

    @Inject
    private UserRepository userRepository;

    // ==================== DTO compact ====================

    public record CreateBookingRequest(
            @NotNull UUID fieldId,
            @NotNull OffsetDateTime startAt,
            @NotNull OffsetDateTime endAt,
            String notes
    ) {
        public CreateBookingRequest(UUID fieldId, OffsetDateTime startAt, OffsetDateTime endAt) {
            this(fieldId, startAt, endAt, null);
        }
    }

    // ==================== Méthodes ====================

    public Booking createBooking(UUID userId, CreateBookingRequest request) {
        User user = userRepository.getById(userId);
        Field field = fieldRepository.getById(request.fieldId());

        if (!field.isActive()) {
            throw new BusinessException("Ce terrain n'est pas disponible");
        }

        validateTimes(request.startAt(), request.endAt());

        List<Booking> overlapping = bookingRepository.findOverlapping(field.getId(), request.startAt(), request.endAt());
        if (!overlapping.isEmpty()) {
            throw new BusinessException("Ce créneau est déjà réservé. Choisissez un autre horaire.");
        }

        BigDecimal totalAmount = calcPrice(field, request.startAt(), request.endAt());
        Booking booking = new Booking(user, field, request.startAt(), request.endAt(), totalAmount);
        booking.setNotes(request.notes());

        bookingRepository.save(booking);
        LOG.info("Réservation créée: " + booking.getId() + " pour le terrain: " + field.getName());
        return booking;
    }

    public List<Booking> getUserBookings(UUID userId) {
        return bookingRepository.findByUser(userId);
    }

    public Booking getBookingById(UUID bookingId) {
        return bookingRepository.getById(bookingId);
    }

    public Booking cancelBooking(UUID bookingId, UUID userId, String reason) {
        Booking booking = getBookingById(bookingId);
        if (!booking.getUser().getId().equals(userId)) {
            throw new BusinessException("Vous ne pouvez annuler que vos propres réservations");
        }
        booking.cancel(reason);
        return bookingRepository.save(booking);
    }

    public Booking confirmBooking(UUID bookingId) {
        Booking booking = getBookingById(bookingId);
        booking.confirm();
        return bookingRepository.save(booking);
    }

    public int expireOverdueBookings() {
        List<Booking> expired = bookingRepository.findExpired(OffsetDateTime.now());
        expired.forEach(b -> {
            b.expire();
            bookingRepository.save(b);
        });
        return expired.size();
    }

    // ==================== Helpers ====================

    private void validateTimes(OffsetDateTime startAt, OffsetDateTime endAt) {
        if (!startAt.isBefore(endAt)) throw new BusinessException("L'heure de début doit être avant la fin");
        if (startAt.isBefore(OffsetDateTime.now())) throw new BusinessException("Impossible de réserver dans le passé");
        Duration duration = Duration.between(startAt, endAt);
        if (duration.toMinutes() < MIN_BOOKING_MINUTES)
            throw new BusinessException("Durée minimale : " + MIN_BOOKING_MINUTES + " minutes");
        if (duration.toHours() > MAX_BOOKING_HOURS)
            throw new BusinessException("Durée maximale : " + MAX_BOOKING_HOURS + " heures");
    }

    private BigDecimal calcPrice(Field field, OffsetDateTime startAt, OffsetDateTime endAt) {
        long minutes = Duration.between(startAt, endAt).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        return field.getPricePerHour().multiply(hours).setScale(2, RoundingMode.HALF_UP);
    }
}
