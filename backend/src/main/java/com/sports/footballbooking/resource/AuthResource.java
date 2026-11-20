package com.sports.footballbooking.resource;

import com.sports.footballbooking.dto.AuthResponse;
import com.sports.footballbooking.dto.LoginRequest;
import com.sports.footballbooking.dto.RegisterRequest;
import com.sports.footballbooking.service.AuthService;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    private AuthService authService;

    @POST
    @Path("/register")
    public Response register(@Valid RegisterRequest req) {
        AuthResponse res = authService.register(req);
        return Response.status(Response.Status.CREATED).entity(res).build();
    }

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequest req) {
        AuthResponse res = authService.login(req);
        return Response.ok(res).build();
    }
}
