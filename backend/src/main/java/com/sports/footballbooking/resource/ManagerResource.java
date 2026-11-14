package com.sports.footballbooking.resource;

import com.sports.footballbooking.config.Authenticated;
import com.sports.footballbooking.config.SecurityUtils;
import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.repository.FieldRepository;
import com.sports.footballbooking.service.AuthService;
import com.sports.footballbooking.service.BookingService;
import com.sports.footballbooking.service.FieldService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.math.BigDecimal;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Endpoints réservés aux gérants de terrain (FIELD_MANAGER).
 * Toutes les routes sont protégées par @Authenticated + vérification de rôle.
 */
@Path("/manager")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class ManagerResource {

    @Inject
    private AuthService authService;

    @Inject
    private FieldService fieldService;

    @Inject
    private BookingService bookingService;

    @Inject
    private FieldRepository fieldRepository;

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record ToggleFieldRequest(boolean active) {}
    public record ManagerCancelRequest(String reason) {}

    // ── Helper ──────────────────────────────────────────────────────────────

    /**
     * Vérifie que le caller est FIELD_MANAGER ou ADMIN, sinon lève 403.
     */
    private User requireManager(SecurityContext sec) {
        UUID userId = SecurityUtils.getUserId(sec);
        if (userId == null) {
            throw new WebApplicationException(Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"message\":\"Non authentifié\"}").build());
        }
        User caller = authService.getUserById(userId);
        if (caller.getRole() != User.Role.FIELD_MANAGER && caller.getRole() != User.Role.ADMIN) {
            throw new WebApplicationException(Response.status(Response.Status.FORBIDDEN)
                    .entity("{\"message\":\"Accès réservé aux gérants de terrain\"}").build());
        }
        return caller;
    }

    // ── Terrains du gérant ───────────────────────────────────────────────────

    /**
     * GET /manager/fields — Terrains appartenant au gérant connecté.
     */
    @GET
    @Path("/fields")
    public Response getMyFields(@Context SecurityContext sec) {
        User manager = requireManager(sec);
        List<Field> fields = fieldRepository.findByOwner(manager.getId());
        return Response.ok(fields).build();
    }

    /**
     * POST /manager/fields — Créer un nouveau terrain pour le gérant connecté.
     */
    @POST
    @Path("/fields")
    public Response createField(
            @Context SecurityContext sec,
            @Valid FieldService.FieldRequest request) {
        User manager = requireManager(sec);
        Field field = fieldService.createField(request, manager.getId());
        return Response.created(URI.create("/api/v1/manager/fields/" + field.getId()))
                .entity(field)
                .build();
    }

    /**
     * PATCH /manager/fields/{id}/active — Activer ou désactiver un terrain du gérant.
     */
    @PATCH
    @Path("/fields/{id}/active")
    public Response toggleFieldActive(
            @PathParam("id") UUID fieldId,
            ToggleFieldRequest body,
            @Context SecurityContext sec) {
        User manager = requireManager(sec);
        Field field = fieldService.getFieldById(fieldId);
        if (field.getOwner() == null || !field.getOwner().getId().equals(manager.getId())) {
            throw new BusinessException("Ce terrain ne vous appartient pas");
        }
        Field updated = fieldService.setFieldActive(fieldId, body.active());
        return Response.ok(updated).build();
    }

    /**
     * PUT /manager/fields/{id} — Modifier un terrain du gérant.
     */
    @PUT
    @Path("/fields/{id}")
    public Response updateField(
            @PathParam("id") UUID fieldId,
            @Valid FieldService.FieldRequest request,
            @Context SecurityContext sec) {
        User manager = requireManager(sec);
        Field field = fieldService.getFieldById(fieldId);
        if (field.getOwner() == null || !field.getOwner().getId().equals(manager.getId())) {
            throw new BusinessException("Ce terrain ne vous appartient pas");
        }
        Field updated = fieldService.updateField(fieldId, request);
        return Response.ok(updated).build();
    }

    // ── Statistiques ─────────────────────────────────────────────────────────

    /**
     * GET /manager/stats — Statistiques agrégées pour le tableau de bord.
     */
    @GET
    @Path("/stats")
    public Response getDashboardStats(@Context SecurityContext sec) {
        User manager = requireManager(sec);
        List<Field> fields = fieldRepository.findByOwner(manager.getId());

        // Collecte toutes les réservations des terrains du gérant
        List<Booking> allBookings = new ArrayList<>();
        for (Field f : fields) {
            allBookings.addAll(bookingService.getBookingsByField(f.getId()));
        }

        long confirmed = allBookings.stream()
                .filter(b -> b.getStatus() == com.sports.footballbooking.entity.Booking.Status.CONFIRMED
                          || b.getStatus() == com.sports.footballbooking.entity.Booking.Status.COMPLETED)
                .count();

        long pending = allBookings.stream()
                .filter(b -> b.getStatus() == com.sports.footballbooking.entity.Booking.Status.PENDING_PAYMENT)
                .count();

        long cancelled = allBookings.stream()
                .filter(b -> b.getStatus() == com.sports.footballbooking.entity.Booking.Status.CANCELLED)
                .count();

        BigDecimal totalRevenue = allBookings.stream()
                .filter(b -> b.getStatus() == com.sports.footballbooking.entity.Booking.Status.CONFIRMED
                          || b.getStatus() == com.sports.footballbooking.entity.Booking.Status.COMPLETED)
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        DashboardStats stats = new DashboardStats(
                fields.size(),
                allBookings.size(),
                (int) confirmed,
                (int) pending,
                (int) cancelled,
                totalRevenue.doubleValue()
        );
        return Response.ok(stats).build();
    }

    // ── Réservations ─────────────────────────────────────────────────────────

    /**
     * GET /manager/bookings — Toutes les réservations des terrains du gérant.
     */
    @GET
    @Path("/bookings")
    public Response getMyBookings(@Context SecurityContext sec) {
        User manager = requireManager(sec);
        List<Field> fields = fieldRepository.findByOwner(manager.getId());
        List<Booking> allBookings = new ArrayList<>();
        for (Field f : fields) {
            allBookings.addAll(bookingService.getBookingsByField(f.getId()));
        }
        allBookings.sort((a, b) -> b.getStartAt().compareTo(a.getStartAt()));
        return Response.ok(allBookings).build();
    }

    /**
     * PATCH /manager/bookings/{id}/confirm — Valider une réservation d'un terrain du gérant.
     */
    @PATCH
    @Path("/bookings/{id}/confirm")
    public Response confirmBooking(
            @PathParam("id") UUID bookingId,
            @Context SecurityContext sec) {
        User manager = requireManager(sec);
        Booking booking = bookingService.confirmBookingByManager(bookingId, manager.getId());
        return Response.ok(booking).build();
    }

    /**
     * PATCH /manager/bookings/{id}/cancel — Annuler une réservation d'un terrain du gérant.
     */
    @PATCH
    @Path("/bookings/{id}/cancel")
    public Response cancelBooking(
            @PathParam("id") UUID bookingId,
            ManagerCancelRequest body,
            @Context SecurityContext sec) {
        User manager = requireManager(sec);
        String reason = (body != null && body.reason() != null && !body.reason().isBlank())
                ? body.reason()
                : "Annulé par le gérant du complexe";
        Booking booking = bookingService.cancelBookingByManager(bookingId, manager.getId(), reason);
        return Response.ok(booking).build();
    }

    // ── DTO interne ──────────────────────────────────────────────────────────

    public record DashboardStats(
            int totalFields,
            int totalBookings,
            int confirmedBookings,
            int pendingBookings,
            int cancelledBookings,
            double totalRevenue
    ) {}
}
