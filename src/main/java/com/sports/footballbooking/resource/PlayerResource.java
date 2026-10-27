package com.sports.footballbooking.resource;

import com.sports.footballbooking.entity.Player;
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
        List<Player> players = playerService.searchPlayers(city);
        return Response.ok(players).build();
    }

    @GET
    @Path("/available")
    public Response searchAvailablePlayers(@QueryParam("city") String city) {
        List<Player> players = playerService.searchPlayers(city);
        return Response.ok(players).build();
    }

    @GET
    @Path("/me")
    public Response getMyProfile(@HeaderParam("X-User-Id") UUID userId) {
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\": \"X-User-Id header requis\"}")
                    .build();
        }
        Player player = playerService.getPlayer(userId);
        return Response.ok(player).build();
    }

    @PUT
    @Path("/me")
    public Response updateMyProfile(@HeaderParam("X-User-Id") UUID userId,
                                    PlayerService.UpdateProfileRequest request) {
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\": \"X-User-Id header requis\"}")
                    .build();
        }
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
    public Response updateProfile(@PathParam("userId") UUID userId,
                                  PlayerService.UpdateProfileRequest request) {
        Player player = playerService.updateProfile(userId, request);
        return Response.ok(player).build();
    }
}
