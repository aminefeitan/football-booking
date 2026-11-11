package com.sports.footballbooking.resource;

import com.sports.footballbooking.config.Authenticated;
import com.sports.footballbooking.config.SecurityUtils;
import com.sports.footballbooking.entity.Player;
import com.sports.footballbooking.service.PlayerService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

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
        List<Player> players = playerService.searchPlayers(city);
        return Response.ok(players).build();
    }

    @GET
    @Path("/available")
    public Response searchAvailablePlayers(@QueryParam("city") String city) {
        List<Player> players = playerService.searchAvailablePlayers(city);
        return Response.ok(players).build();
    }

    @GET
    @Path("/me")
    @Authenticated
    public Response getMyProfile(@Context SecurityContext sec) {
        UUID userId = SecurityUtils.getUserId(sec);
        Player player = playerService.getPlayer(userId);
        return Response.ok(player).build();
    }

    @PUT
    @Path("/me")
    @Authenticated
    public Response updateMyProfile(@Context SecurityContext sec,
                                    PlayerService.UpdateProfileRequest request) {
        UUID userId = SecurityUtils.getUserId(sec);
        Player player = playerService.updateProfile(userId, request);
        return Response.ok(player).build();
    }

    @GET
    @Path("/{userId}")
    public Response getProfile(@PathParam("userId") UUID userId) {
        Player player = playerService.getPlayer(userId);
        return Response.ok(player).build();
    }

    @PUT
    @Path("/{userId}")
    @Authenticated
    public Response updateProfile(@PathParam("userId") UUID userId,
                                  PlayerService.UpdateProfileRequest request) {
        Player player = playerService.updateProfile(userId, request);
        return Response.ok(player).build();
    }
}
