package com.sports.footballbooking.resource;

import com.sports.footballbooking.dto.UpdateUserRoleRequest;
import com.sports.footballbooking.dto.UpdateUserStatusRequest;
import com.sports.footballbooking.dto.UserResponse;
import com.sports.footballbooking.service.UserService;
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

@Path("/admin/users")
@RolesAllowed("ADMIN")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserAdminResource {

    @Inject
    private UserService userService;

    @GET
    public List<UserResponse> listUsers() {
        return userService.listUsers();
    }

    @PATCH
    @Path("/{id}/status")
    public UserResponse updateStatus(@Context SecurityContext sec, @PathParam("id") UUID id, @Valid UpdateUserStatusRequest req) {
        UUID adminId = UUID.fromString(sec.getUserPrincipal().getName());
        return userService.updateUserStatus(adminId, id, req.status());
    }

    @PATCH
    @Path("/{id}/role")
    public UserResponse updateRole(@Context SecurityContext sec, @PathParam("id") UUID id, @Valid UpdateUserRoleRequest req) {
        UUID adminId = UUID.fromString(sec.getUserPrincipal().getName());
        return userService.updateUserRole(adminId, id, req.role());
    }
}
