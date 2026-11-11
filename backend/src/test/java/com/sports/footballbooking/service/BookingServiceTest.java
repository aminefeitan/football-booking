package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.Player;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.repository.BookingRepository;
import com.sports.footballbooking.repository.FieldRepository;
import com.sports.footballbooking.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private FieldRepository fieldRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BookingService bookingService;

    private User testUser;
    private Field testField;
    private UUID userId;
    private UUID fieldId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        fieldId = UUID.randomUUID();

        testUser = new Player("player@example.com", "hashed_pwd", "Karim", "Benzema");
        testUser.setId(userId);

        testField = new Field("Terrain A", "Casablanca", "5v5", new BigDecimal("300.00"));
        testField.setId(fieldId);
    }

    @Test
    @DisplayName("Should create booking when time slot is valid and available")
    void testCreateBookingSuccess() {
        OffsetDateTime start = OffsetDateTime.now().plusDays(1).withHour(18).withMinute(0);
        OffsetDateTime end = start.plusHours(2);

        var request = new BookingService.CreateBookingRequest(
                fieldId, start, end, "Match entre amis");

        when(userRepository.getById(userId)).thenReturn(testUser);
        when(fieldRepository.getById(fieldId)).thenReturn(testField);
        when(bookingRepository.findOverlapping(fieldId, start, end)).thenReturn(Collections.emptyList());

        Booking booking = bookingService.createBooking(userId, request);

        assertNotNull(booking);
        assertEquals(Booking.Status.PENDING_PAYMENT, booking.getStatus());
        assertEquals(new BigDecimal("600.00"), booking.getTotalAmount());
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should reject booking if requested duration exceeds max limit (4 hours)")
    void testRejectBookingDurationTooLong() {
        OffsetDateTime start = OffsetDateTime.now().plusDays(1).withHour(14).withMinute(0);
        OffsetDateTime end = start.plusHours(5);

        var request = new BookingService.CreateBookingRequest(fieldId, start, end);

        when(userRepository.getById(userId)).thenReturn(testUser);
        when(fieldRepository.getById(fieldId)).thenReturn(testField);

        BusinessException exception = assertThrows(BusinessException.class, () ->
                bookingService.createBooking(userId, request));

        assertTrue(exception.getMessage().contains("Durée maximale"));
    }

    @Test
    @DisplayName("Should reject booking if timeslot overlaps an existing booking")
    void testRejectOverlappingBooking() {
        OffsetDateTime start = OffsetDateTime.now().plusDays(1).withHour(18).withMinute(0);
        OffsetDateTime end = start.plusHours(1);

        var request = new BookingService.CreateBookingRequest(fieldId, start, end);

        Booking existing = new Booking(testUser, testField, start, end, new BigDecimal("300.00"));

        when(userRepository.getById(userId)).thenReturn(testUser);
        when(fieldRepository.getById(fieldId)).thenReturn(testField);
        when(bookingRepository.findOverlapping(fieldId, start, end)).thenReturn(List.of(existing));

        BusinessException exception = assertThrows(BusinessException.class, () ->
                bookingService.createBooking(userId, request));

        assertTrue(exception.getMessage().contains("déjà réservé"));
    }

    @Test
    @DisplayName("Should confirm booking status upon payment")
    void testConfirmBooking() {
        UUID bookingId = UUID.randomUUID();
        OffsetDateTime start = OffsetDateTime.now().plusDays(1).withHour(18).withMinute(0);
        OffsetDateTime end = start.plusHours(1);

        Booking booking = new Booking(testUser, testField, start, end, new BigDecimal("300.00"));
        booking.setId(bookingId);

        when(bookingRepository.getById(bookingId)).thenReturn(booking);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        Booking confirmed = bookingService.confirmBooking(bookingId);

        assertEquals(Booking.Status.CONFIRMED, confirmed.getStatus());
        assertNull(confirmed.getExpiresAt());
        verify(bookingRepository, times(1)).save(booking);
    }
}
