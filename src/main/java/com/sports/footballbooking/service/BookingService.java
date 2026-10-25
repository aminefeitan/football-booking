package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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

    @PersistenceContext(unitName = "footballBookingPU")
    private EntityManager em;

    // ==================== Requête imbriquée ====================

    public static class CreateBookingRequest {
        @NotNull public UUID fieldId;
        @NotNull public OffsetDateTime startAt;
        @NotNull public OffsetDateTime endAt;
        public String notes;
    }

    // ==================== Méthodes ====================

    public Booking createBooking(UUID userId, CreateBookingRequest request) {
        User user = em.find(User.class, userId);
        if (user == null) throw new NotFoundException("User", userId);

        Field field = em.find(Field.class, request.fieldId);
        if (field == null) throw new NotFoundException("Field", request.fieldId);
        if (!field.isActive()) throw new BusinessException("Ce terrain n'est pas disponible");

        validateTimes(request.startAt, request.endAt);

        List<Booking> overlapping = em.createNamedQuery("Booking.findOverlapping", Booking.class)
                .setParameter("fieldId", field.getId())
                .setParameter("startAt", request.startAt)
                .setParameter("endAt", request.endAt)
                .getResultList();
        if (!overlapping.isEmpty()) {
            throw new BusinessException("Ce créneau est déjà réservé. Choisissez un autre horaire.");
        }

        BigDecimal totalAmount = calcPrice(field, request.startAt, request.endAt);
        Booking booking = new Booking(user, field, request.startAt, request.endAt, totalAmount);
        booking.setNotes(request.notes);
        em.persist(booking);

        LOG.info("Réservation créée: " + booking.getId() + " pour le terrain: " + field.getName());
        return booking;
    }

    public List<Booking> getUserBookings(UUID userId) {
        return em.createNamedQuery("Booking.findByUser", Booking.class)
                .setParameter("userId", userId)
                .getResultList();
    }

    public Booking getBookingById(UUID bookingId) {
        Booking booking = em.find(Booking.class, bookingId);
        if (booking == null) throw new NotFoundException("Booking", bookingId);
        return booking;
    }

    public Booking cancelBooking(UUID bookingId, UUID userId, String reason) {
        Booking booking = getBookingById(bookingId);
        if (!booking.getUser().getId().equals(userId)) {
            throw new BusinessException("Vous ne pouvez annuler que vos propres réservations");
        }
        booking.cancel(reason);
        return em.merge(booking);
    }

    public Booking confirmBooking(UUID bookingId) {
        Booking booking = getBookingById(bookingId);
        booking.confirm();
        return em.merge(booking);
    }

    public int expireOverdueBookings() {
        List<Booking> expired = em.createNamedQuery("Booking.findExpired", Booking.class)
                .setParameter("now", OffsetDateTime.now())
                .getResultList();
        expired.forEach(b -> { b.expire(); em.merge(b); });
        return expired.size();
    }

    // ==================== Helpers privés ====================

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
