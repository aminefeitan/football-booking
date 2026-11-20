package com.sports.footballbooking.resource;

import com.sports.footballbooking.dto.FieldResponse;
import com.sports.footballbooking.dto.FieldStatusRequest;
import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.service.FieldService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;
import java.util.UUID;

@Path("/admin/fields")
@RolesAllowed("ADMIN")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FieldAdminResource {

    @Inject
    private FieldService fieldService;

    @GET
    public List<FieldResponse> listFieldsForReview(@QueryParam("status") Field.FieldStatus status) {
        return fieldService.findForAdmin(status);
    }

    @PATCH
    @Path("/{id}/status")
    public FieldResponse reviewStatus(@PathParam("id") UUID id, @Context SecurityContext sec, @Valid FieldStatusRequest req) {
        UUID adminId = UUID.fromString(sec.getUserPrincipal().getName());
        return fieldService.reviewFieldStatus(id, adminId, req.status());
    }
}
