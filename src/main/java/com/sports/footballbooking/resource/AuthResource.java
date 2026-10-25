package com.sports.footballbooking.resource;

import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.service.AuthService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.UUID;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    private AuthService authService;

    @POST
    @Path("/register")
    public Response register(@Valid AuthService.RegisterRequest request) {
        AuthService.AuthResponse response = authService.register(request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @POST
    @Path("/login")
    public Response login(@Valid AuthService.LoginRequest request) {
        AuthService.AuthResponse response = authService.login(request);
        return Response.ok(response).build();
    }

    @GET
    @Path("/me")
    public Response getCurrentUser(@HeaderParam("X-User-Id") UUID userId) {
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\": \"X-User-Id header requis\"}")
                    .build();
        }
        User user = authService.getUserById(userId);
        return Response.ok(user).build();
    }
}
