package com.sports.footballbooking.security;

import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

@Provider
public class ApiExceptionMapper implements ExceptionMapper<Throwable> {

    private static final Logger LOG = Logger.getLogger(ApiExceptionMapper.class.getName());

    public record ErrorResponse(int status, String message) {}

    @Override
    public Response toResponse(Throwable exception) {
        // SQLState 23505 (unique violation) or 23P01 (exclusion violation) in cause chain -> 409
        SQLException sqlEx = findSQLException(exception);
        if (sqlEx != null) {
            String state = sqlEx.getSQLState();
            if ("23505".equals(state) || "23P01".equals(state)) {
                return Response.status(Response.Status.CONFLICT)
                        .type(MediaType.APPLICATION_JSON)
                        .entity(new ErrorResponse(409, "Conflit : ressource déjà existante ou créneau indisponible"))
                        .build();
            }
        }

        if (exception instanceof ConstraintViolationException) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(new ErrorResponse(400, "Données invalides"))
                    .build();
        }

        if (exception instanceof WebApplicationException we) {
            int status = we.getResponse().getStatus();
            String message = we.getMessage();
            if (message == null || message.isBlank() || message.startsWith("HTTP " + status)) {
                if (status == Response.Status.UNAUTHORIZED.getStatusCode()) {
                    message = "Non autorisé";
                } else if (status == Response.Status.FORBIDDEN.getStatusCode()) {
                    message = "Accès interdit";
                } else if (status == Response.Status.NOT_FOUND.getStatusCode()) {
                    message = "Ressource introuvable";
                } else {
                    Response.Status statusEnum = Response.Status.fromStatusCode(status);
                    message = statusEnum != null ? statusEnum.getReasonPhrase() : "Erreur requête";
                }
            }

            Response.ResponseBuilder builder = Response.status(status)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(new ErrorResponse(status, message));

            if (we.getResponse().getHeaders().containsKey(HttpHeaders.WWW_AUTHENTICATE)) {
                builder.header(HttpHeaders.WWW_AUTHENTICATE, we.getResponse().getHeaderString(HttpHeaders.WWW_AUTHENTICATE));
            }
            return builder.build();
        }

        LOG.log(Level.SEVERE, "Unexpected error occurred", exception);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .type(MediaType.APPLICATION_JSON)
                .entity(new ErrorResponse(500, "Une erreur inattendue est survenue"))
                .build();
    }

    private SQLException findSQLException(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof SQLException sqlEx) {
                return sqlEx;
            }
            if (current.getCause() == current) {
                break;
            }
            current = current.getCause();
        }
        return null;
    }
}
