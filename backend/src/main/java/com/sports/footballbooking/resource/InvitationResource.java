package com.sports.footballbooking.resource;

import com.sports.footballbooking.dto.TeamInvitationResponse;
import com.sports.footballbooking.service.TeamService;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;
import java.util.UUID;

@Path("/invitations")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InvitationResource {

    @Inject
    private TeamService teamService;

    @GET
    @Path("/me")
    public List<TeamInvitationResponse> getMyInvitations(@Context SecurityContext sec) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        return teamService.getMyInvitations(userId);
    }

    @POST
    @Path("/{id}/accept")
    public Response acceptInvitation(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        teamService.acceptInvitation(id, userId);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/decline")
    public Response declineInvitation(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID userId = UUID.fromString(sec.getUserPrincipal().getName());
        teamService.declineInvitation(id, userId);
        return Response.noContent().build();
    }
}
