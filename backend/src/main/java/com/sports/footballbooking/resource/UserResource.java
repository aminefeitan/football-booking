package com.sports.footballbooking.resource;

import com.sports.footballbooking.dto.UpdatePasswordRequest;
import com.sports.footballbooking.dto.UpdateProfileRequest;
import com.sports.footballbooking.dto.UserResponse;
import com.sports.footballbooking.service.UserService;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.UUID;

@Path("/users")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    private UserService userService;

    @GET
    @Path("/me")
    public UserResponse getProfile(@Context SecurityContext sec) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        return userService.getProfile(userId);
    }

    @PUT
    @Path("/me")
    public UserResponse updateProfile(@Context SecurityContext sec, @Valid UpdateProfileRequest req) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        return userService.updateProfile(userId, req);
    }

    @PUT
    @Path("/me/password")
    public Response updatePassword(@Context SecurityContext sec, @Valid UpdatePasswordRequest req) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        userService.updatePassword(userId, req);
        return Response.noContent().build();
    }
}
