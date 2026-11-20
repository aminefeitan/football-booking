package com.sports.footballbooking.resource;

import com.sports.footballbooking.dto.*;
import com.sports.footballbooking.service.TeamService;
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

@Path("/teams")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TeamResource {

    @Inject
    private TeamService teamService;

    @POST
    @RolesAllowed("PLAYER")
    public Response createTeam(@Context SecurityContext sec, @Valid CreateTeamRequest req) {
        UUID creatorId = UUID.fromString(sec.getUserPrincipal().getName());
        TeamResponse res = teamService.createTeam(creatorId, req);
        return Response.status(Response.Status.CREATED).entity(res).build();
    }

    @GET
    @Path("/me")
    public List<TeamResponse> getMyTeams(@Context SecurityContext sec) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        return teamService.getMyTeams(userId);
    }

    @GET
    @Path("/{id}")
    public TeamResponse getTeamDetails(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        return teamService.getTeamDetails(id, userId);
    }

    @GET
    public List<TeamSummaryResponse> searchTeams(@QueryParam("name") String name) {
        return teamService.searchTeams(name);
    }

    @POST
    @Path("/{id}/invitations")
    @RolesAllowed("PLAYER")
    public Response inviteMember(@PathParam("id") UUID teamId, @Context SecurityContext sec, @Valid InviteMemberRequest req) {
        UUID captainId = UUID.fromString(sec.getUserPrincipal().getName());
        TeamInvitationResponse res = teamService.inviteMember(teamId, captainId, req);
        return Response.status(Response.Status.CREATED).entity(res).build();
    }

    @DELETE
    @Path("/{id}/members/{userId}")
    @RolesAllowed("PLAYER")
    public Response removeMember(@PathParam("id") UUID teamId, @PathParam("userId") UUID targetUserId, @Context SecurityContext sec) {
        UUID captainId = UUID.fromString(sec.getUserPrincipal().getName());
        teamService.removeMember(teamId, captainId, targetUserId);
        return Response.noContent().build();
    }
}
