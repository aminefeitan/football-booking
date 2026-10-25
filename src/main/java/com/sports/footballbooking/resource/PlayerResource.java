package com.sports.footballbooking.resource;

import com.sports.footballbooking.entity.PlayerProfile;
import com.sports.footballbooking.service.PlayerService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/players")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlayerResource {

    @Inject
    private PlayerService playerService;

    @GET
    public Response searchPlayers(@QueryParam("city") String city) {
        List<PlayerProfile> players = playerService.searchPlayers(city);
        return Response.ok(players).build();
    }

    @GET
    @Path("/{userId}")
    public Response getProfile(@PathParam("userId") UUID userId) {
        PlayerProfile profile = playerService.getOrCreateProfile(userId);
        return Response.ok(profile).build();
    }

    @PUT
    @Path("/{userId}")
    public Response updateProfile(@PathParam("userId") UUID userId,
                                  PlayerService.UpdateProfileRequest request) {
        PlayerProfile profile = playerService.updateProfile(userId, request);
        return Response.ok(profile).build();
    }
}
