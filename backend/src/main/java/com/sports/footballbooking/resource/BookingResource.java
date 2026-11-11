package com.sports.footballbooking.resource;

import com.sports.footballbooking.config.Authenticated;
import com.sports.footballbooking.config.SecurityUtils;
import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.service.BookingService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Path("/bookings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BookingResource {

    @Inject
    private BookingService bookingService;

    // DTO compact
    public record CancelRequest(String reason) {}

    @POST
    @Authenticated
    public Response createBooking(
            @Context SecurityContext sec,
            @Valid BookingService.CreateBookingRequest request) {

        UUID userId = SecurityUtils.getUserId(sec);
        Booking booking = bookingService.createBooking(userId, request);
        return Response.created(URI.create("/api/v1/bookings/" + booking.getId()))
                .entity(booking).build();
    }

    @GET
    @Path("/me")
    @Authenticated
    public Response getMyBookings(@Context SecurityContext sec) {
        UUID userId = SecurityUtils.getUserId(sec);
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
    @Authenticated
    public Response cancelBooking(
            @PathParam("id") UUID id,
            @Context SecurityContext sec,
            CancelRequest cancelRequest) {

        UUID userId = SecurityUtils.getUserId(sec);
        String reason = (cancelRequest != null && cancelRequest.reason() != null)
                ? cancelRequest.reason()
                : "Annulation demandée par l'utilisateur";

        Booking booking = bookingService.cancelBooking(id, userId, reason);
        return Response.ok(booking).build();
    }
}
