package com.sports.footballbooking.resource;

import com.sports.footballbooking.dto.AdminStatsResponse;
import com.sports.footballbooking.dto.ManagerStatsResponse;
import com.sports.footballbooking.service.StatsService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;

import java.time.OffsetDateTime;
import java.util.UUID;

@Path("/stats")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
public class StatsResource {

    @Inject
    private StatsService statsService;

    @GET
    @Path("/manager")
    @RolesAllowed("FIELD_MANAGER")
    public ManagerStatsResponse getManagerStats(
            @Context SecurityContext sec,
            @QueryParam("from") String fromStr,
            @QueryParam("to") String toStr) {
        UUID managerId = UUID.fromString(sec.getUserPrincipal().getName());
        OffsetDateTime from = (fromStr != null && !fromStr.isBlank()) ? OffsetDateTime.parse(fromStr) : null;
        OffsetDateTime to = (toStr != null && !toStr.isBlank()) ? OffsetDateTime.parse(toStr) : null;
        return statsService.getManagerStats(managerId, from, to);
    }

    @GET
    @Path("/admin")
    @RolesAllowed("ADMIN")
    public AdminStatsResponse getAdminStats() {
        return statsService.getAdminStats();
    }
}
