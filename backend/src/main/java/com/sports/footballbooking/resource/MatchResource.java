package com.sports.footballbooking.resource;

import com.sports.footballbooking.dto.CreateMatchRequest;
import com.sports.footballbooking.dto.MatchResponse;
import com.sports.footballbooking.service.MatchService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;
import java.util.UUID;

@Path("/matches")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MatchResource {

    @Inject
    private MatchService matchService;

    @POST
    @RolesAllowed("PLAYER")
    public Response createMatch(@Context SecurityContext sec, @Valid CreateMatchRequest req) {
        UUID callerId = UUID.fromString(sec.getUserPrincipal().getName());
        MatchResponse res = matchService.createMatch(callerId, req);
        return Response.status(Response.Status.CREATED).entity(res).build();
    }

    @GET
    @Path("/me")
    public List<MatchResponse> getMyMatches(@Context SecurityContext sec) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        return matchService.getMyMatches(userId);
    }

    @GET
    @Path("/{id}")
    public MatchResponse getMatchDetails(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        boolean isAdmin = sec.isUserInRole("ADMIN");
        return matchService.getMatchDetails(id, userId, isAdmin);
    }

    @PATCH
    @Path("/{id}/cancel")
    public Response cancelMatch(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        boolean isAdmin = sec.isUserInRole("ADMIN");
        matchService.cancelMatch(id, userId, isAdmin);
        return Response.noContent().build();
    }
}
