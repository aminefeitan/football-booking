package com.sports.footballbooking.security;

import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.service.AuthService;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;
import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

@Provider
@ApplicationScoped
@Priority(Priorities.AUTHENTICATION)
public class AuthFilter implements ContainerRequestFilter {

    @Inject
    private AuthService authService;

    @Inject
    private JwtService jwtService;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String method = requestContext.getMethod();
        String path = requestContext.getUriInfo().getPath();

        if (isPublic(method, path)) {
            return;
        }

        String authHeader = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new NotAuthorizedException("Bearer");
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            throw new NotAuthorizedException("Bearer");
        }

        Optional<JwtService.UserPrincipalData> principalDataOpt = jwtService.parseToken(token);
        if (principalDataOpt.isEmpty()) {
            throw new NotAuthorizedException("Bearer");
        }

        JwtService.UserPrincipalData principalData = principalDataOpt.get();
        final UUID userId = principalData.userId();
        final String roleName;
        final String statusName;

        // Fast path: if claims are present in token, authenticate completely in-memory with 0 database queries!
        if (principalData.role() != null && principalData.status() != null) {
            roleName = principalData.role();
            statusName = principalData.status();
            if (!"ACTIVE".equalsIgnoreCase(statusName)) {
                throw new jakarta.ws.rs.ForbiddenException("Ce compte est " + statusName.toLowerCase());
            }
        } else {
            // Fallback for legacy tokens without claims: query database
            User user = authService.authenticate(token);
            roleName = user.getRole() != null ? user.getRole().name() : null;
            statusName = user.getStatus() != null ? user.getStatus().name() : null;
        }

        SecurityContext originalContext = requestContext.getSecurityContext();
        boolean isSecure = originalContext != null && originalContext.isSecure();

        requestContext.setSecurityContext(new SecurityContext() {
            @Override
            public Principal getUserPrincipal() {
                return () -> userId.toString();
            }

            @Override
            public boolean isUserInRole(String role) {
                return roleName != null && roleName.equalsIgnoreCase(role);
            }

            @Override
            public boolean isSecure() {
                return isSecure;
            }

            @Override
            public String getAuthenticationScheme() {
                return "Bearer";
            }
        });
    }

    private boolean isPublic(String method, String path) {
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }
        String normalized = path == null ? "" : path.trim();
        if (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.startsWith("api/v1/")) {
            normalized = normalized.substring(7);
        }

        if ("POST".equalsIgnoreCase(method)) {
            return "auth/login".equalsIgnoreCase(normalized) || "auth/register".equalsIgnoreCase(normalized);
        }
        if ("GET".equalsIgnoreCase(method)) {
            if ("fields".equalsIgnoreCase(normalized) || "fields/".equalsIgnoreCase(normalized)) {
                return true;
            }
            if ("fields/mine".equalsIgnoreCase(normalized)) {
                return false;
            }
            if (normalized.matches("(?i)^fields/[0-9a-fA-F\\-]+$")) {
                return true;
            }
            if (normalized.matches("(?i)^fields/[0-9a-fA-F\\-]+/slots.*$")) {
                return true;
            }
        }
        return false;
    }
}
