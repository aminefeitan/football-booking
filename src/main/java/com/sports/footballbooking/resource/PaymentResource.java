package com.sports.footballbooking.resource;

import com.sports.footballbooking.entity.Payment;
import com.sports.footballbooking.service.PaymentService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PaymentResource {

    @Inject
    private PaymentService paymentService;

    @POST
    public Response processPayment(@HeaderParam("X-User-Id") UUID userId,
                                   @Valid PaymentService.PaymentRequest request) {
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\": \"X-User-Id header requis\"}").build();
        }
        Payment payment = paymentService.processPayment(userId, request);
        return Response.status(Response.Status.CREATED).entity(payment).build();
    }

    @GET
    @Path("/my")
    public Response getMyPayments(@HeaderParam("X-User-Id") UUID userId) {
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\": \"X-User-Id header requis\"}").build();
        }
        List<Payment> payments = paymentService.getUserPayments(userId);
        return Response.ok(payments).build();
    }
}
