package com.sports.footballbooking.resource;

import com.sports.footballbooking.entity.Match;
import com.sports.footballbooking.entity.MatchParticipant;
import com.sports.footballbooking.service.MatchService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Path("/matches")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MatchResource {

    @Inject
    private MatchService matchService;

    @GET
    public Response listUpcomingMatches(@QueryParam("city") String city) {
        List<Match> matches = matchService.listUpcomingMatches(city);
        return Response.ok(matches).build();
    }

    @GET
    @Path("/{id}")
    public Response getMatch(@PathParam("id") UUID id) {
        return Response.ok(matchService.getMatchById(id)).build();
    }

    @POST
    public Response createMatch(@HeaderParam("X-User-Id") UUID userId,
                                @Valid MatchService.CreateMatchRequest request) {
        if (userId == null) return unauthorized();
        Match match = matchService.createMatch(userId, request);
        return Response.created(URI.create("/api/v1/matches/" + match.getId())).entity(match).build();
    }

    @POST
    @Path("/{id}/join")
    public Response joinMatch(@PathParam("id") UUID matchId,
                              @HeaderParam("X-User-Id") UUID userId,
                              MatchService.JoinMatchRequest request) {
        if (userId == null) return unauthorized();
        MatchParticipant participant = matchService.joinMatch(matchId, userId, request);
        return Response.status(Response.Status.CREATED).entity(participant).build();
    }

    @DELETE
    @Path("/{id}/leave")
    public Response leaveMatch(@PathParam("id") UUID matchId,
                               @HeaderParam("X-User-Id") UUID userId) {
        if (userId == null) return unauthorized();
        matchService.leaveMatch(matchId, userId);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/cancel")
    public Response cancelMatch(@PathParam("id") UUID matchId,
                                @HeaderParam("X-User-Id") UUID userId) {
        if (userId == null) return unauthorized();
        return Response.ok(matchService.cancelMatch(matchId, userId)).build();
    }

    private Response unauthorized() {
        return Response.status(Response.Status.UNAUTHORIZED)
                .entity("{\"error\": \"X-User-Id header requis\"}").build();
    }
}
