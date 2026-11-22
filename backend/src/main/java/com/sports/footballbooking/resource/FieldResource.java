package com.sports.footballbooking.resource;

import com.sports.footballbooking.dto.FieldRequest;
import com.sports.footballbooking.dto.FieldResponse;
import com.sports.footballbooking.dto.SlotResponse;
import com.sports.footballbooking.service.FieldService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Path("/fields")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FieldResource {

    @Inject
    private FieldService fieldService;

    @GET
    public List<FieldResponse> listFields(
            @QueryParam("city") String city,
            @QueryParam("fieldType") String fieldType,
            @QueryParam("maxPrice") BigDecimal maxPrice,
            @QueryParam("indoor") Boolean indoor,
            @QueryParam("hasLights") Boolean hasLights,
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("20") Integer size) {
        return fieldService.searchApprovedFields(city, fieldType, maxPrice, indoor, hasLights, page, size);
    }

    @GET
    @Path("/mine")
    @RolesAllowed("FIELD_MANAGER")
    public List<FieldResponse> listMyFields(@Context SecurityContext sec) {
        UUID ownerId = UUID.fromString(sec.getUserPrincipal().getName());
        return fieldService.findByOwner(ownerId);
    }

    @GET
    @Path("/{id}")
    public FieldResponse getField(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID currentUserId = extractUserId(sec);
        boolean isAdmin = sec != null && sec.isUserInRole("ADMIN");
        return fieldService.getFieldDetails(id, currentUserId, isAdmin);
    }

    @GET
    @Path("/{id}/slots")
    public List<SlotResponse> getSlots(
            @PathParam("id") UUID id,
            @QueryParam("date") String dateStr,
            @Context SecurityContext sec) {
        LocalDate date = (dateStr != null && !dateStr.isBlank()) ? LocalDate.parse(dateStr) : null;
        UUID currentUserId = extractUserId(sec);
        boolean isAdmin = sec != null && sec.isUserInRole("ADMIN");
        return fieldService.getFieldSlots(id, date, currentUserId, isAdmin);
    }

    @POST
    @RolesAllowed("FIELD_MANAGER")
    public Response createField(@Context SecurityContext sec, @Valid FieldRequest req) {
        UUID ownerId = UUID.fromString(sec.getUserPrincipal().getName());
        FieldResponse created = fieldService.createField(ownerId, req);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"FIELD_MANAGER", "ADMIN"})
    public FieldResponse updateField(@PathParam("id") UUID id, @Context SecurityContext sec, @Valid FieldRequest req) {
        UUID callerId = UUID.fromString(sec.getUserPrincipal().getName());
        boolean isAdmin = sec.isUserInRole("ADMIN");
        return fieldService.updateField(id, callerId, isAdmin, req);
    }

    @PUT
    @Path("/{id}/photo")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed({"FIELD_MANAGER", "ADMIN"})
    public FieldResponse uploadPhoto(
            @PathParam("id") UUID id,
            @Context SecurityContext sec,
            List<jakarta.ws.rs.core.EntityPart> parts) throws java.io.IOException {
        UUID callerId = UUID.fromString(sec.getUserPrincipal().getName());
        boolean isAdmin = sec.isUserInRole("ADMIN");

        if (parts == null || parts.isEmpty()) {
            throw new BadRequestException("Part 'file' manquante dans le formulaire");
        }

        jakarta.ws.rs.core.EntityPart filePart = parts.stream()
                .filter(p -> "file".equalsIgnoreCase(p.getName()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Part 'file' manquante dans le formulaire"));

        return fieldService.uploadPhoto(id, callerId, isAdmin, filePart.getContent());
    }

    @DELETE
    @Path("/{id}/photo")
    @RolesAllowed({"FIELD_MANAGER", "ADMIN"})
    public Response deletePhoto(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID callerId = UUID.fromString(sec.getUserPrincipal().getName());
        boolean isAdmin = sec.isUserInRole("ADMIN");
        fieldService.deletePhoto(id, callerId, isAdmin);
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}/photo")
    @Produces({"image/jpeg", "image/png", "image/webp"})
    public Response getPhoto(@PathParam("id") UUID id, @Context SecurityContext sec) {
        UUID callerId = extractUserId(sec);
        boolean isAdmin = sec != null && sec.isUserInRole("ADMIN");
        FieldService.PhotoData photo = fieldService.getPhoto(id, callerId, isAdmin);
        return Response.ok(photo.bytes(), photo.contentType())
                .header("X-Content-Type-Options", "nosniff")
                .header("Cache-Control", "private, max-age=3600")
                .build();
    }

    private UUID extractUserId(SecurityContext sec) {
        if (sec != null && sec.getUserPrincipal() != null && sec.getUserPrincipal().getName() != null) {
            try {
                return UUID.fromString(sec.getUserPrincipal().getName());
            } catch (IllegalArgumentException ignored) {}
        }
        return null;
    }
}
