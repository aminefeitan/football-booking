package com.sports.footballbooking.service;

import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private EntityManager em;

    @Mock
    private TypedQuery<Booking> bookingTypedQuery;

    @InjectMocks
    private BookingService bookingService;

    private User testUser;
    private Field testField;
    private UUID userId;
    private UUID fieldId;

    @BeforeEach
    void setUp() throws Exception {
        userId = UUID.randomUUID();
        fieldId = UUID.randomUUID();

        testUser = new User("player@example.com", "hashed_pwd", "Karim", "Benzema");
        java.lang.reflect.Field idField = User.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(testUser, userId);

        testField = new Field("Terrain A", "Casablanca", "5v5", new BigDecimal("300.00"));
        java.lang.reflect.Field fieldIdField = Field.class.getDeclaredField("id");
        fieldIdField.setAccessible(true);
        fieldIdField.set(testField, fieldId);
    }

    @Test
    @DisplayName("Should create booking when time slot is valid and available")
    void testCreateBookingSuccess() {
        OffsetDateTime start = OffsetDateTime.now().plusDays(1).withHour(18).withMinute(0);
        OffsetDateTime end = start.plusHours(2);

        BookingService.CreateBookingRequest request = new BookingService.CreateBookingRequest();
        request.fieldId = fieldId;
        request.startAt = start;
        request.endAt = end;
        request.notes = "Match entre amis";

        when(em.find(User.class, userId)).thenReturn(testUser);
        when(em.find(Field.class, fieldId)).thenReturn(testField);
        when(em.createNamedQuery("Booking.findOverlapping", Booking.class)).thenReturn(bookingTypedQuery);
        when(bookingTypedQuery.setParameter(anyString(), any())).thenReturn(bookingTypedQuery);
        when(bookingTypedQuery.getResultList()).thenReturn(Collections.emptyList());

        Booking booking = bookingService.createBooking(userId, request);

        assertNotNull(booking);
        assertEquals(Booking.Status.PENDING_PAYMENT, booking.getStatus());
        assertEquals(new BigDecimal("600.00"), booking.getTotalAmount());
        verify(em, times(1)).persist(any(Booking.class));
    }

    @Test
    @DisplayName("Should reject booking if requested duration exceeds max limit (4 hours)")
    void testRejectBookingDurationTooLong() {
        OffsetDateTime start = OffsetDateTime.now().plusDays(1).withHour(14).withMinute(0);
        OffsetDateTime end = start.plusHours(5);

        BookingService.CreateBookingRequest request = new BookingService.CreateBookingRequest();
        request.fieldId = fieldId;
        request.startAt = start;
        request.endAt = end;

        when(em.find(User.class, userId)).thenReturn(testUser);
        when(em.find(Field.class, fieldId)).thenReturn(testField);

        BusinessException exception = assertThrows(BusinessException.class, () ->
                bookingService.createBooking(userId, request));

        assertTrue(exception.getMessage().contains("Durée maximale"));
    }

    @Test
    @DisplayName("Should reject booking if timeslot overlaps an existing booking")
    void testRejectOverlappingBooking() {
        OffsetDateTime start = OffsetDateTime.now().plusDays(1).withHour(18).withMinute(0);
        OffsetDateTime end = start.plusHours(1);

        BookingService.CreateBookingRequest request = new BookingService.CreateBookingRequest();
        request.fieldId = fieldId;
        request.startAt = start;
        request.endAt = end;

        Booking existing = new Booking(testUser, testField, start, end, new BigDecimal("300.00"));

        when(em.find(User.class, userId)).thenReturn(testUser);
        when(em.find(Field.class, fieldId)).thenReturn(testField);
        when(em.createNamedQuery("Booking.findOverlapping", Booking.class)).thenReturn(bookingTypedQuery);
        when(bookingTypedQuery.setParameter(anyString(), any())).thenReturn(bookingTypedQuery);
        when(bookingTypedQuery.getResultList()).thenReturn(List.of(existing));

        BusinessException exception = assertThrows(BusinessException.class, () ->
                bookingService.createBooking(userId, request));

        assertTrue(exception.getMessage().contains("déjà réservé"));
    }

    @Test
    @DisplayName("Should confirm booking status upon payment")
    void testConfirmBooking() throws Exception {
        UUID bookingId = UUID.randomUUID();
        OffsetDateTime start = OffsetDateTime.now().plusDays(1).withHour(18).withMinute(0);
        OffsetDateTime end = start.plusHours(1);

        Booking booking = new Booking(testUser, testField, start, end, new BigDecimal("300.00"));
        java.lang.reflect.Field bIdField = Booking.class.getDeclaredField("id");
        bIdField.setAccessible(true);
        bIdField.set(booking, bookingId);

        when(em.find(Booking.class, bookingId)).thenReturn(booking);
        when(em.merge(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        Booking confirmed = bookingService.confirmBooking(bookingId);

        assertEquals(Booking.Status.CONFIRMED, confirmed.getStatus());
        assertNull(confirmed.getExpiresAt());
        verify(em, times(1)).merge(booking);
    }
}
