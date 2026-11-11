package com.sports.footballbooking.resource;

import com.sports.footballbooking.config.Authenticated;
import com.sports.footballbooking.config.SecurityUtils;
import com.sports.footballbooking.entity.Payment;
import com.sports.footballbooking.service.PaymentService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.core.SecurityContext;
import java.util.List;
import java.util.UUID;

@Path("/payments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PaymentResource {

    @Inject
    private PaymentService paymentService;

    @POST
    @Authenticated
    public Response processPayment(@Context SecurityContext sec,
                                   @Valid PaymentService.PaymentRequest request) {
        UUID userId = SecurityUtils.getUserId(sec);
        Payment payment = paymentService.processPayment(userId, request);
        return Response.status(Response.Status.CREATED).entity(payment).build();
    }

    @GET
    @Path("/my")
    @Authenticated
    public Response getMyPayments(@Context SecurityContext sec) {
        UUID userId = SecurityUtils.getUserId(sec);
        List<Payment> payments = paymentService.getUserPayments(userId);
        return Response.ok(payments).build();
    }
}
