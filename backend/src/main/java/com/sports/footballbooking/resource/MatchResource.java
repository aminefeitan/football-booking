package com.sports.footballbooking.resource;

import com.sports.footballbooking.config.Authenticated;
import com.sports.footballbooking.config.SecurityUtils;
import com.sports.footballbooking.entity.Match;
import com.sports.footballbooking.entity.MatchParticipant;
import com.sports.footballbooking.service.MatchService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

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
    @Authenticated
    public Response createMatch(@Context SecurityContext sec,
                                @Valid MatchService.CreateMatchRequest request) {
        UUID userId = SecurityUtils.getUserId(sec);
        Match match = matchService.createMatch(userId, request);
        return Response.created(URI.create("/api/v1/matches/" + match.getId())).entity(match).build();
    }

    @POST
    @Path("/{id}/join")
    @Authenticated
    public Response joinMatch(@PathParam("id") UUID matchId,
                              @Context SecurityContext sec,
                              MatchService.JoinMatchRequest request) {
        UUID userId = SecurityUtils.getUserId(sec);
        MatchParticipant participant = matchService.joinMatch(matchId, userId, request);
        return Response.status(Response.Status.CREATED).entity(participant).build();
    }

    @DELETE
    @Path("/{id}/leave")
    @Authenticated
    public Response leaveMatch(@PathParam("id") UUID matchId,
                               @Context SecurityContext sec) {
        UUID userId = SecurityUtils.getUserId(sec);
        matchService.leaveMatch(matchId, userId);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/cancel")
    @Authenticated
    public Response cancelMatch(@PathParam("id") UUID matchId,
                                @Context SecurityContext sec) {
        UUID userId = SecurityUtils.getUserId(sec);
        return Response.ok(matchService.cancelMatch(matchId, userId)).build();
    }
}
