package com.sports.footballbooking.resource;

import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.service.BookingService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Path("/bookings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BookingResource {

    @Inject
    private BookingService bookingService;

    @POST
    public Response createBooking(
            @HeaderParam("X-User-Id") UUID userId,
            @Valid BookingService.CreateBookingRequest request) {

        if (userId == null) return unauthorized();

        Booking booking = bookingService.createBooking(userId, request);
        return Response.created(URI.create("/api/v1/bookings/" + booking.getId()))
                .entity(booking).build();
    }

    @GET
    @Path("/me")
    public Response getMyBookings(@HeaderParam("X-User-Id") UUID userId) {
        if (userId == null) return unauthorized();
        List<Booking> bookings = bookingService.getUserBookings(userId);
        return Response.ok(bookings).build();
    }

    @GET
    @Path("/{id}")
    public Response getBooking(@PathParam("id") UUID id) {
        return Response.ok(bookingService.getBookingById(id)).build();
    }

    @PATCH
    @Path("/{id}/cancel")
    public Response cancelBooking(
            @PathParam("id") UUID id,
            @HeaderParam("X-User-Id") UUID userId,
            CancelRequest cancelRequest) {

        if (userId == null) return unauthorized();

        String reason = cancelRequest != null ? cancelRequest.reason : "Annulation demandée par l'utilisateur";
        Booking booking = bookingService.cancelBooking(id, userId, reason);
        return Response.ok(booking).build();
    }

    // ==================== DTO imbriqué ====================

    public static class CancelRequest {
        public String reason;
    }

    // ==================== Helper ====================

    private Response unauthorized() {
        return Response.status(Response.Status.UNAUTHORIZED)
                .entity("{\"error\": \"X-User-Id header requis\"}").build();
    }
}
