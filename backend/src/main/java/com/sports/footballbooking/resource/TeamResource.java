package com.sports.footballbooking.resource;

import com.sports.footballbooking.config.Authenticated;
import com.sports.footballbooking.config.SecurityUtils;
import com.sports.footballbooking.entity.Team;
import com.sports.footballbooking.entity.TeamInvitation;
import com.sports.footballbooking.entity.TeamMember;
import com.sports.footballbooking.service.TeamService;
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

@Path("/teams")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TeamResource {

    @Inject
    private TeamService teamService;

    public record InviteRequest(UUID invitedUserId) {}

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
    @Authenticated
    public Response createTeam(
            @Context SecurityContext sec,
            @Valid TeamService.CreateTeamRequest request) {
        UUID userId = SecurityUtils.getUserId(sec);
        Team team = teamService.createTeam(userId, request);
        return Response.created(URI.create("/api/v1/teams/" + team.getId())).entity(team).build();
    }

    @POST
    @Path("/{id}/members")
    @Authenticated
    public Response addMember(@PathParam("id") UUID teamId,
                              @Valid TeamService.AddMemberRequest request) {
        TeamMember member = teamService.addMember(teamId, request);
        return Response.status(Response.Status.CREATED).entity(member).build();
    }

    @DELETE
    @Path("/{id}/members/{userId}")
    @Authenticated
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
    @Authenticated
    public Response invitePlayer(@PathParam("id") UUID teamId,
                                 @Context SecurityContext sec,
                                 InviteRequest request) {
        UUID userId = SecurityUtils.getUserId(sec);
        TeamInvitation inv = teamService.invitePlayer(teamId, userId, request.invitedUserId());
        return Response.status(Response.Status.CREATED).entity(inv).build();
    }

    @GET
    @Path("/{id}/invitations")
    public Response getTeamInvitations(@PathParam("id") UUID teamId) {
        return Response.ok(teamService.getTeamInvitations(teamId)).build();
    }

    @GET
    @Path("/invitations/pending")
    @Authenticated
    public Response getMyPendingInvitations(@Context SecurityContext sec) {
        UUID userId = SecurityUtils.getUserId(sec);
        return Response.ok(teamService.getPendingInvitations(userId)).build();
    }

    @POST
    @Path("/invitations/{invitationId}/accept")
    @Authenticated
    public Response acceptInvitation(@PathParam("invitationId") UUID invitationId,
                                     @Context SecurityContext sec) {
        UUID userId = SecurityUtils.getUserId(sec);
        teamService.acceptInvitation(invitationId, userId);
        return Response.ok().build();
    }
}
