package com.sports.footballbooking.resource;

import com.sports.footballbooking.dto.BookingResponse;
import com.sports.footballbooking.dto.CreateBookingRequest;
import com.sports.footballbooking.dto.RejectBookingRequest;
import com.sports.footballbooking.entity.Booking;
import com.sports.footballbooking.service.BookingService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;
import java.util.UUID;

@Path("/bookings")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BookingResource {

    @Inject
    private BookingService bookingService;

    @POST
    @RolesAllowed("PLAYER")
    public Response createBooking(@Context SecurityContext sec, @Valid CreateBookingRequest req) {
        UUID callerId = UUID.fromString(sec.getUserPrincipal().getName());
        BookingResponse res = bookingService.createBooking(callerId, req);
        return Response.status(Response.Status.CREATED).entity(res).build();
    }

    @GET
    @Path("/me")
    public List<BookingResponse> getMyBookings(@Context SecurityContext sec) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        return bookingService.getMyBookings(userId);
    }

    @GET
    @Path("/manager")
    @RolesAllowed("FIELD_MANAGER")
    public List<BookingResponse> getManagerBookings(
            @Context SecurityContext sec,
            @QueryParam("status") Booking.BookingStatus status) {
        UUID managerId = UUID.fromString(sec.getUserPrincipal().getName());
        return bookingService.getManagerBookings(managerId, status);
    }

    @GET
    @Path("/{id}")
    public BookingResponse getBookingDetails(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID callerId = UUID.fromString(sec.getUserPrincipal().getName());
        boolean isAdmin = sec.isUserInRole("ADMIN");
        return bookingService.getBookingDetails(id, callerId, isAdmin);
    }

    @PATCH
    @Path("/{id}/confirm")
    @RolesAllowed({"FIELD_MANAGER", "ADMIN"})
    public BookingResponse confirmBooking(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID callerId = UUID.fromString(sec.getUserPrincipal().getName());
        boolean isAdmin = sec.isUserInRole("ADMIN");
        return bookingService.confirmBooking(id, callerId, isAdmin);
    }

    @PATCH
    @Path("/{id}/reject")
    @RolesAllowed({"FIELD_MANAGER", "ADMIN"})
    public BookingResponse rejectBooking(@PathParam("id") UUID id, @Context SecurityContext sec, @Valid RejectBookingRequest req) {
        UUID callerId = UUID.fromString(sec.getUserPrincipal().getName());
        boolean isAdmin = sec.isUserInRole("ADMIN");
        return bookingService.rejectBooking(id, callerId, isAdmin, req);
    }

    @PATCH
    @Path("/{id}/cancel")
    public BookingResponse cancelBooking(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID callerId = UUID.fromString(sec.getUserPrincipal().getName());
        boolean isAdmin = sec.isUserInRole("ADMIN");
        return bookingService.cancelBooking(id, callerId, isAdmin);
    }
}
