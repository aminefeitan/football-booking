package com.sports.footballbooking.resource;

import com.sports.footballbooking.entity.Team;
import com.sports.footballbooking.entity.TeamInvitation;
import com.sports.footballbooking.entity.TeamMember;
import com.sports.footballbooking.service.TeamService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Path("/teams")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TeamResource {

    @Inject
    private TeamService teamService;

    @GET
    public Response listTeams(@QueryParam("city") String city) {
        List<Team> teams = teamService.listTeams(city);
        return Response.ok(teams).build();
    }

    @GET
    @Path("/{id}")
    public Response getTeam(@PathParam("id") UUID id) {
        return Response.ok(teamService.getTeamById(id)).build();
    }

    @POST
    public Response createTeam(@HeaderParam("X-User-Id") UUID userId,
                               @Valid TeamService.CreateTeamRequest request) {
        if (userId == null) return unauthorized();
        Team team = teamService.createTeam(userId, request);
        return Response.created(URI.create("/api/v1/teams/" + team.getId())).entity(team).build();
    }

    @POST
    @Path("/{id}/members")
    public Response addMember(@PathParam("id") UUID teamId,
                              @Valid TeamService.AddMemberRequest request) {
        TeamMember member = teamService.addMember(teamId, request);
        return Response.status(Response.Status.CREATED).entity(member).build();
    }

    @DELETE
    @Path("/{id}/members/{userId}")
    public Response removeMember(@PathParam("id") UUID teamId,
                                 @PathParam("userId") UUID userId) {
        teamService.removeMember(teamId, userId);
        return Response.noContent().build();
    }

    @GET
    @Path("/user/{userId}")
    public Response getUserTeams(@PathParam("userId") UUID userId) {
        List<Team> teams = teamService.getUserTeams(userId);
        return Response.ok(teams).build();
    }

    // ==================== Invitations ====================

    @POST
    @Path("/{id}/invitations")
    public Response invitePlayer(@PathParam("id") UUID teamId,
                                 @HeaderParam("X-User-Id") UUID userId,
                                 InviteRequest request) {
        if (userId == null) return unauthorized();
        TeamInvitation inv = teamService.invitePlayer(teamId, userId, request.invitedUserId);
        return Response.status(Response.Status.CREATED).entity(inv).build();
    }

    @GET
    @Path("/{id}/invitations")
    public Response getTeamInvitations(@PathParam("id") UUID teamId) {
        return Response.ok(teamService.getTeamInvitations(teamId)).build();
    }

    @GET
    @Path("/invitations/pending")
    public Response getMyPendingInvitations(@HeaderParam("X-User-Id") UUID userId) {
        if (userId == null) return unauthorized();
        return Response.ok(teamService.getPendingInvitations(userId)).build();
    }

    @POST
    @Path("/invitations/{invitationId}/accept")
    public Response acceptInvitation(@PathParam("invitationId") UUID invitationId,
                                     @HeaderParam("X-User-Id") UUID userId) {
        if (userId == null) return unauthorized();
        teamService.acceptInvitation(invitationId, userId);
        return Response.ok().build();
    }

    @POST
    @Path("/invitations/{invitationId}/decline")
    public Response declineInvitation(@PathParam("invitationId") UUID invitationId,
                                      @HeaderParam("X-User-Id") UUID userId) {
        if (userId == null) return unauthorized();
        teamService.declineInvitation(invitationId, userId);
        return Response.ok().build();
    }

    // ==================== DTOs imbriqués ====================

    public static class InviteRequest {
        public UUID invitedUserId;
    }

    // ==================== Helper ====================

    private Response unauthorized() {
        return Response.status(Response.Status.UNAUTHORIZED)
                .entity("{\"error\": \"X-User-Id header requis\"}").build();
    }
}
