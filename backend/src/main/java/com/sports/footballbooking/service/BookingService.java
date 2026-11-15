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
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
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

    public record SlotDto(String time, String status) {}

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
        validateFieldWorkingHours(field, request.startAt(), request.endAt());

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

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByField(UUID fieldId) {
        return bookingRepository.findByField(fieldId);
    }

    public List<SlotDto> getFieldSlots(UUID fieldId, LocalDate date) {
        Field field = fieldRepository.getById(fieldId);
        List<Booking> bookings = bookingRepository.findByField(fieldId);

        String openStr = field.getOpenTime() != null ? field.getOpenTime() : "09:00";
        String closeStr = field.getCloseTime() != null ? field.getCloseTime() : "23:00";

        LocalTime openTime;
        LocalTime closeTime;
        try {
            openTime = LocalTime.parse(openStr);
        } catch (Exception e) {
            openTime = LocalTime.of(9, 0);
        }
        try {
            closeTime = LocalTime.parse(closeStr);
        } catch (Exception e) {
            closeTime = LocalTime.of(23, 0);
        }

        int startHour = openTime.getHour();
        int endHour = closeTime.getHour();
        if (endHour <= startHour) {
            endHour += 24; // fermeture après minuit (ex. 00:00 -> 24)
        }

        List<SlotDto> slots = new ArrayList<>();
        LocalDate queryDate = date != null ? date : LocalDate.now();
        LocalDate today = LocalDate.now();
        LocalTime nowTime = LocalTime.now();

        for (int h = startHour; h < endHour; h++) {
            int currentHour = h % 24;
            LocalDate slotDate = (h >= 24) ? queryDate.plusDays(1) : queryDate;

            // Ne pas afficher les créneaux déjà passés (date passée ou heure déjà écoulée aujourd'hui)
            if (slotDate.isBefore(today)) {
                continue;
            }
            if (slotDate.isEqual(today) && currentHour <= nowTime.getHour()) {
                continue;
            }

            String timeFormatted = String.format("%02d:00", currentHour);

            // Début et fin du créneau horaire
            OffsetDateTime slotStart = slotDate.atTime(currentHour, 0).atOffset(ZoneOffset.UTC);
            OffsetDateTime slotEnd = slotStart.plusHours(1);

            // Vérifie si une réservation active chevauche ce créneau
            boolean isBooked = bookings.stream().anyMatch(b -> {
                if (b.getStatus() == Booking.Status.CANCELLED) return false;
                // Chevauchement : b.startAt < slotEnd && b.endAt > slotStart
                return b.getStartAt().isBefore(slotEnd) && b.getEndAt().isAfter(slotStart);
            });

            slots.add(new SlotDto(timeFormatted, isBooked ? "reserved" : "available"));
        }

        return slots;
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

    public Booking cancelBookingByManager(UUID bookingId, UUID managerId, String reason) {
        Booking booking = getBookingById(bookingId);
        Field field = booking.getField();
        if (field == null || field.getOwner() == null || !field.getOwner().getId().equals(managerId)) {
            throw new BusinessException("Vous ne pouvez annuler que les réservations de vos propres terrains");
        }
        booking.cancel(reason != null ? reason : "Annulé par le gérant du terrain");
        return bookingRepository.save(booking);
    }

    public Booking confirmBookingByManager(UUID bookingId, UUID managerId) {
        Booking booking = getBookingById(bookingId);
        Field field = booking.getField();
        if (field == null || field.getOwner() == null || !field.getOwner().getId().equals(managerId)) {
            throw new BusinessException("Vous ne pouvez valider que les réservations de vos propres terrains");
        }
        booking.confirm();
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

    private void validateFieldWorkingHours(Field field, OffsetDateTime startAt, OffsetDateTime endAt) {
        if (field.getOpenTime() == null || field.getCloseTime() == null) return;
        try {
            java.time.LocalTime open = java.time.LocalTime.parse(field.getOpenTime());
            java.time.LocalTime close = java.time.LocalTime.parse(field.getCloseTime());
            java.time.LocalTime bookingStart = startAt.toLocalTime();
            java.time.LocalTime bookingEnd = endAt.toLocalTime();
            if (bookingStart.isBefore(open) || bookingEnd.isAfter(close)) {
                throw new BusinessException(String.format(
                        "Ce terrain est ouvert de %s à %s. Votre créneau (%s - %s) est en dehors des horaires d'ouverture.",
                        field.getOpenTime(), field.getCloseTime(), bookingStart, bookingEnd
                ));
            }
        } catch (java.time.format.DateTimeParseException ignored) {
            // Ignorer si format personnalisé
        }
    }

    private BigDecimal calcPrice(Field field, OffsetDateTime startAt, OffsetDateTime endAt) {
        long minutes = Duration.between(startAt, endAt).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        return field.getPricePerHour().multiply(hours).setScale(2, RoundingMode.HALF_UP);
    }
}
