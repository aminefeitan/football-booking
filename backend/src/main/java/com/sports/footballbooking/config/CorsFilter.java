package com.sports.footballbooking.config;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;

/**
 * Filtre CORS sécurisé et compatible React / Next.js.
 * Supporte Access-Control-Allow-Credentials avec renvoi dynamique de l'Origine
 * et gère les requêtes preflight OPTIONS en phase @PreMatching.
 */
@Provider
@PreMatching
@Priority(Priorities.AUTHENTICATION - 100)
public class CorsFilter implements ContainerRequestFilter, ContainerResponseFilter {

    private static final String ALLOWED_HEADERS =
            "Origin, Content-Type, Accept, Authorization, X-User-Id, X-Requested-With";
    private static final String ALLOWED_METHODS =
            "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD";

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        // Preflight OPTIONS requests handling
        if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())) {
            Response.ResponseBuilder response = Response.ok();
            applyHeaders(requestContext.getHeaderString("Origin"), response);
            requestContext.abortWith(response.build());
        }
    }

    @Override
    public void filter(ContainerRequestContext requestContext,
                       ContainerResponseContext responseContext) throws IOException {
        String origin = requestContext.getHeaderString("Origin");
        if (origin != null && !origin.isBlank()) {
            responseContext.getHeaders().putSingle("Access-Control-Allow-Origin", origin);
            responseContext.getHeaders().putSingle("Access-Control-Allow-Credentials", "true");
        } else {
            responseContext.getHeaders().putSingle("Access-Control-Allow-Origin", "*");
        }

        responseContext.getHeaders().putSingle("Access-Control-Allow-Headers", ALLOWED_HEADERS);
        responseContext.getHeaders().putSingle("Access-Control-Allow-Methods", ALLOWED_METHODS);
        responseContext.getHeaders().putSingle("Access-Control-Max-Age", "3600");
    }

    private void applyHeaders(String origin, Response.ResponseBuilder response) {
        if (origin != null && !origin.isBlank()) {
            response.header("Access-Control-Allow-Origin", origin);
            response.header("Access-Control-Allow-Credentials", "true");
        } else {
            response.header("Access-Control-Allow-Origin", "*");
        }
        response.header("Access-Control-Allow-Headers", ALLOWED_HEADERS);
        response.header("Access-Control-Allow-Methods", ALLOWED_METHODS);
        response.header("Access-Control-Max-Age", "3600");
    }
}
