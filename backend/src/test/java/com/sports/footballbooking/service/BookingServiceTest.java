package com.sports.footballbooking.service;

import com.sports.footballbooking.dto.BookingResponse;
import com.sports.footballbooking.dto.CreateBookingRequest;
import com.sports.footballbooking.dto.RejectBookingRequest;
import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.Match;
import com.sports.footballbooking.entity.Team;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.BookingRepository;
import com.sports.footballbooking.repository.FieldRepository;
import com.sports.footballbooking.repository.MatchRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;
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
    private MatchRepository matchRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BookingService bookingService;

    private User playerUser;
    private User managerUser;
    private User otherManagerUser;
    private Field testField;
    private Match testMatch;
    private UUID playerId;
    private UUID managerId;
    private UUID otherManagerId;
    private UUID fieldId;
    private UUID matchId;
    private ZoneId zone;

    @BeforeEach
    void setUp() throws Exception {
        playerId = UUID.randomUUID();
        managerId = UUID.randomUUID();
        otherManagerId = UUID.randomUUID();
        fieldId = UUID.randomUUID();
        matchId = UUID.randomUUID();
        zone = ZoneId.of("Africa/Casablanca");

        playerUser = new User("player@example.com", "hash", "Karim", "Benzema", "+212600000000", User.Role.PLAYER);
        setId(playerUser, playerId);

        managerUser = new User("manager@example.com", "hash", "Gérant", "Principal", "+212611111111", User.Role.FIELD_MANAGER);
        setId(managerUser, managerId);

        otherManagerUser = new User("other@example.com", "hash", "Autre", "Gérant", "+212622222222", User.Role.FIELD_MANAGER);
        setId(otherManagerUser, otherManagerId);

        testField = new Field();
        setId(testField, fieldId);
        testField.setName("Terrain Anfa");
        testField.setCity("Casablanca");
        testField.setAddress("Boulevard d'Anfa");
        testField.setFieldType("5v5");
        testField.setPricePerHour(new BigDecimal("300.00"));
        testField.setOpenTime(LocalTime.of(8, 0));
        testField.setCloseTime(LocalTime.of(23, 0));
        testField.setStatus(Field.FieldStatus.APPROVED);
        testField.setOwner(managerUser);

        Team homeTeam = new Team("Raja", "Club");
        setId(homeTeam, UUID.randomUUID());
        Team awayTeam = new Team("Wydad", "Club");
        setId(awayTeam, UUID.randomUUID());

        ZonedDateTime tomorrow18h = ZonedDateTime.now(zone).plusDays(1).withHour(18).withMinute(0).withSecond(0).withNano(0);
        testMatch = new Match(playerUser, homeTeam, awayTeam, tomorrow18h.toOffsetDateTime(), 60);
        setId(testMatch, matchId);
    }

    private void setId(Object entity, UUID id) throws Exception {
        java.lang.reflect.Field idField = entity.getClass().getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }

    @Test
    @DisplayName("1. Réservations concurrentes / chevauchement : rejet 409 Conflict")
    void testConcurrentOrOverlappingBookingRejection() {
        CreateBookingRequest req = new CreateBookingRequest(matchId, fieldId, "Match officiel");

        when(userRepository.findById(playerId)).thenReturn(Optional.of(playerUser));
        when(matchRepository.findById(matchId)).thenReturn(Optional.of(testMatch));
        when(bookingRepository.findActiveByMatch(matchId)).thenReturn(Optional.empty());
        when(bookingRepository.countPendingByUser(playerId)).thenReturn(0L);
        when(fieldRepository.findByIdForUpdate(fieldId)).thenReturn(Optional.of(testField));
        when(bookingRepository.existsOverlapping(eq(fieldId), any(OffsetDateTime.class), any(OffsetDateTime.class))).thenReturn(true);

        ClientErrorException ex = assertThrows(ClientErrorException.class, () ->
                bookingService.createBooking(playerId, req));

        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
        assertTrue(ex.getMessage().contains("déjà réservé"));
        verify(bookingRepository, never()).persist(any(Booking.class));
    }

    @Test
    @DisplayName("Création d'une réservation valide avec calcul correct du montant (300 MAD pour 60 min)")
    void testCreateBookingSuccess() {
        CreateBookingRequest req = new CreateBookingRequest(matchId, fieldId, "Match entre amis");

        when(userRepository.findById(playerId)).thenReturn(Optional.of(playerUser));
        when(matchRepository.findById(matchId)).thenReturn(Optional.of(testMatch));
        when(bookingRepository.findActiveByMatch(matchId)).thenReturn(Optional.empty());
        when(bookingRepository.countPendingByUser(playerId)).thenReturn(0L);
        when(fieldRepository.findByIdForUpdate(fieldId)).thenReturn(Optional.of(testField));
        when(bookingRepository.existsOverlapping(eq(fieldId), any(OffsetDateTime.class), any(OffsetDateTime.class))).thenReturn(false);

        BookingResponse res = bookingService.createBooking(playerId, req);

        assertNotNull(res);
        assertEquals(Booking.BookingStatus.PENDING, res.status());
        assertEquals(new BigDecimal("300.00"), res.totalAmount());
        assertEquals("MAD", res.currency());
        verify(bookingRepository, times(1)).persist(any(Booking.class));
    }

    @Test
    @DisplayName("7. Réserver terrain PENDING ou REJECTED -> rejet 409 Conflict")
    void testBookPendingOrRejectedFieldThrows409() {
        testField.setStatus(Field.FieldStatus.PENDING);
        CreateBookingRequest req = new CreateBookingRequest(matchId, fieldId, null);

        when(userRepository.findById(playerId)).thenReturn(Optional.of(playerUser));
        when(matchRepository.findById(matchId)).thenReturn(Optional.of(testMatch));
        when(bookingRepository.findActiveByMatch(matchId)).thenReturn(Optional.empty());
        when(bookingRepository.countPendingByUser(playerId)).thenReturn(0L);
        when(fieldRepository.findByIdForUpdate(fieldId)).thenReturn(Optional.of(testField));

        ClientErrorException ex = assertThrows(ClientErrorException.class, () ->
                bookingService.createBooking(playerId, req));
        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
        assertTrue(ex.getMessage().contains("pas approuvé"));
    }

    @Test
    @DisplayName("7. Non-créateur du match qui tente de réserver -> 403 Forbidden")
    void testNonCreatorCannotBook() {
        UUID nonCreatorId = UUID.randomUUID();
        User nonCreator = new User("other@player.com", "hash", "Other", "Player", null, User.Role.PLAYER);
        CreateBookingRequest req = new CreateBookingRequest(matchId, fieldId, null);

        when(userRepository.findById(nonCreatorId)).thenReturn(Optional.of(nonCreator));
        when(matchRepository.findById(matchId)).thenReturn(Optional.of(testMatch));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                bookingService.createBooking(nonCreatorId, req));
        assertTrue(ex.getMessage().contains("Seul le créateur du match"));
    }

    @Test
    @DisplayName("8. Gérant ne peut confirmer/refuser QUE les réservations de son propre terrain")
    void testManagerCanOnlyHandleOwnTerrainBookings() throws Exception {
        UUID bookingId = UUID.randomUUID();
        Booking booking = new Booking(testMatch, playerUser, testField, testMatch.getStartAt(), testMatch.getStartAt().plusHours(1), new BigDecimal("300.00"), null);
        setId(booking, bookingId);

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        // otherManager attempts to confirm -> 403
        ForbiddenException ex1 = assertThrows(ForbiddenException.class, () ->
                bookingService.confirmBooking(bookingId, otherManagerId, false));
        assertTrue(ex1.getMessage().contains("Seul le gérant"));

        // otherManager attempts to reject -> 403
        RejectBookingRequest rejectReq = new RejectBookingRequest("Terrain indisponible");
        ForbiddenException ex2 = assertThrows(ForbiddenException.class, () ->
                bookingService.rejectBooking(bookingId, otherManagerId, false, rejectReq));
        assertTrue(ex2.getMessage().contains("Seul le gérant"));

        // Owner can confirm successfully
        when(userRepository.findById(managerId)).thenReturn(Optional.of(managerUser));
        BookingResponse confirmed = bookingService.confirmBooking(bookingId, managerId, false);
        assertEquals(Booking.BookingStatus.CONFIRMED, confirmed.status());
    }
}
