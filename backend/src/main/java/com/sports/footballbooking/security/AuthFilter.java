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

@Provider
@ApplicationScoped
@Priority(Priorities.AUTHENTICATION)
public class AuthFilter implements ContainerRequestFilter {

    @Inject
    private AuthService authService;

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

        User user = authService.authenticate(token);

        SecurityContext originalContext = requestContext.getSecurityContext();
        boolean isSecure = originalContext != null && originalContext.isSecure();

        requestContext.setSecurityContext(new SecurityContext() {
            @Override
            public Principal getUserPrincipal() {
                return () -> user.getId().toString();
            }

            @Override
            public boolean isUserInRole(String role) {
                return user.getRole() != null && user.getRole().name().equalsIgnoreCase(role);
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
