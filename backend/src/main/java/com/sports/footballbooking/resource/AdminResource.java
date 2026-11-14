package com.sports.footballbooking.resource;

import com.sports.footballbooking.config.Authenticated;
import com.sports.footballbooking.config.SecurityUtils;
import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.BusinessException;
import com.sports.footballbooking.service.AuthService;
import com.sports.footballbooking.service.BookingService;
import com.sports.footballbooking.service.FieldService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints réservés à l'administrateur FootBook.
 * Toutes les routes sont protégées par @Authenticated + vérification de rôle ADMIN.
 */
@Path("/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class AdminResource {

    @Inject
    private AuthService authService;

    @Inject
    private FieldService fieldService;

    @Inject
    private BookingService bookingService;

    // ── DTOs ────────────────────────────────────────────────────────────────

    public record UpdateStatusRequest(String status) {}
    public record ToggleFieldRequest(boolean active) {}

    // ── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Vérifie que l'utilisateur courant est ADMIN, sinon lève 403.
     */
    private void requireAdmin(SecurityContext sec) {
        UUID userId = SecurityUtils.getUserId(sec);
        if (userId == null) {
            throw new WebApplicationException(Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"message\":\"Non authentifié\"}").build());
        }
        User caller = authService.getUserById(userId);
        if (caller.getRole() != User.Role.ADMIN) {
            throw new WebApplicationException(Response.status(Response.Status.FORBIDDEN)
                    .entity("{\"message\":\"Accès réservé aux administrateurs\"}").build());
        }
    }

    // ── Utilisateurs ─────────────────────────────────────────────────────────

    /**
     * GET /admin/users — Liste tous les utilisateurs de la plateforme.
     */
    @GET
    @Path("/users")
    public Response getAllUsers(@Context SecurityContext sec) {
        requireAdmin(sec);
        List<User> users = authService.getAllUsers();
        return Response.ok(users).build();
    }

    /**
     * PATCH /admin/users/{id}/status — Modifier le statut d'un utilisateur (ACTIVE, SUSPENDED, BANNED).
     */
    @PATCH
    @Path("/users/{id}/status")
    public Response updateUserStatus(
            @PathParam("id") UUID userId,
            UpdateStatusRequest body,
            @Context SecurityContext sec) {

        requireAdmin(sec);
        if (body == null || body.status() == null || body.status().isBlank()) {
            throw new BusinessException("Le champ 'status' est requis");
        }
        User.Status newStatus;
        try {
            newStatus = User.Status.valueOf(body.status().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Statut invalide : " + body.status());
        }
        User updated = authService.updateUserStatus(userId, newStatus);
        return Response.ok(updated).build();
    }

    // ── Terrains ─────────────────────────────────────────────────────────────

    /**
     * GET /admin/fields — Liste tous les terrains (actifs ET inactifs).
     */
    @GET
    @Path("/fields")
    public Response getAllFields(@Context SecurityContext sec) {
        requireAdmin(sec);
        List<Field> fields = fieldService.getAllFields();
        return Response.ok(fields).build();
    }

    /**
     * PATCH /admin/fields/{id}/active — Activer ou désactiver un terrain.
     */
    @PATCH
    @Path("/fields/{id}/active")
    public Response setFieldActive(
            @PathParam("id") UUID fieldId,
            ToggleFieldRequest body,
            @Context SecurityContext sec) {

        requireAdmin(sec);
        Field updated = fieldService.setFieldActive(fieldId, body.active());
        return Response.ok(updated).build();
    }

    // ── Réservations ─────────────────────────────────────────────────────────

    /**
     * GET /admin/bookings — Historique complet de toutes les réservations.
     */
    @GET
    @Path("/bookings")
    public Response getAllBookings(@Context SecurityContext sec) {
        requireAdmin(sec);
        List<Booking> bookings = bookingService.getAllBookings();
        return Response.ok(bookings).build();
    }
}

