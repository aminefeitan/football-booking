package com.sports.footballbooking.resource;

import com.sports.footballbooking.entity.Field;
import com.sports.footballbooking.service.FieldService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Path("/fields")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FieldResource {

    @Inject
    private FieldService fieldService;

    @GET
    public Response getFields(
            @QueryParam("city") String city,
            @QueryParam("fieldType") String fieldType,
            @QueryParam("maxPrice") Double maxPrice,
            @QueryParam("indoor") Boolean indoor,
            @QueryParam("hasLights") Boolean hasLights) {

        List<Field> fields = (city != null || fieldType != null || maxPrice != null || indoor != null || hasLights != null)
                ? fieldService.searchFields(city, fieldType, maxPrice, indoor, hasLights)
                : fieldService.getAllActiveFields();

        return Response.ok(fields).build();
    }

    @GET
    @Path("/{id}")
    public Response getField(@PathParam("id") UUID id) {
        return Response.ok(fieldService.getFieldById(id)).build();
    }

    @POST
    public Response createField(
            @HeaderParam("X-User-Id") UUID userId,
            @Valid FieldService.FieldRequest request) {
        Field field = fieldService.createField(request, userId);
        return Response.created(URI.create("/api/v1/fields/" + field.getId())).entity(field).build();
    }

    @PUT
    @Path("/{id}")
    public Response updateField(@PathParam("id") UUID id, @Valid FieldService.FieldRequest request) {
        return Response.ok(fieldService.updateField(id, request)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deleteField(@PathParam("id") UUID id) {
        fieldService.deactivateField(id);
        return Response.noContent().build();
    }
}
