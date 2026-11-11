package com.sports.footballbooking.resource;

import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.service.AuthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    private AuthService authService;

    @GET
    @Path("/{id}")
    public Response getUserById(@PathParam("id") UUID id) {
        User user = authService.getUserById(id);
        return Response.ok(user).build();
    }

    @GET
    public Response listUsersByRole(@QueryParam("role") User.Role role) {
        List<User> users = authService.getUsersByRole(role);
        return Response.ok(users).build();
    }
}
