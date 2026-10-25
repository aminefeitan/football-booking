package com.sports.footballbooking.resource;

import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.exception.NotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @PersistenceContext(unitName = "footballBookingPU")
    private EntityManager em;

    @GET
    @Path("/{id}")
    public Response getUserById(@PathParam("id") UUID id) {
        User user = em.find(User.class, id);
        if (user == null) throw new NotFoundException("User", id);
        return Response.ok(user).build();
    }

    @GET
    public Response listUsersByRole(@QueryParam("role") User.Role role) {
        User.Role filter = role != null ? role : User.Role.PLAYER;
        List<User> users = em.createNamedQuery("User.findByRole", User.class)
                .setParameter("role", filter)
                .getResultList();
        return Response.ok(users).build();
    }
}
