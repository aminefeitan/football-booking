package com.sports.footballbooking.exception;

import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Convertit les exceptions en réponses JSON standardisées.
 */
@Provider
public class ApiExceptionMapper implements ExceptionMapper<Exception> {

    private static final Logger LOG = Logger.getLogger(ApiExceptionMapper.class.getName());

    @Override
    public Response toResponse(Exception exception) {
        if (exception instanceof NotFoundException) {
            return build(404, "NOT_FOUND", exception.getMessage());
        }
        if (exception instanceof BusinessException) {
            return build(409, "CONFLICT", exception.getMessage());
        }
        if (exception instanceof IllegalArgumentException) {
            return build(400, "BAD_REQUEST", exception.getMessage());
        }
        if (exception instanceof ConstraintViolationException cve) {
            String message = cve.getConstraintViolations().stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .reduce((a, b) -> a + "; " + b)
                    .orElse("Validation échouée");
            return build(400, "BAD_REQUEST", message);
        }
        if (exception instanceof WebApplicationException webEx) {
            if (webEx.getCause() instanceof IllegalArgumentException) {
                return build(400, "BAD_REQUEST", "Format d'identifiant invalide (UUID attendu)");
            }
            if (webEx.getResponse() != null && webEx.getResponse().getStatus() == 404) {
                return build(404, "NOT_FOUND", "Ressource introuvable sur cette URL");
            }
            return webEx.getResponse();
        }
        LOG.log(Level.SEVERE, "Erreur inattendue", exception);
        return build(500, "INTERNAL_SERVER_ERROR", "Une erreur inattendue s'est produite");
    }

    private Response build(int status, String error, String message) {
        String json = String.format("{\"status\":%d,\"error\":\"%s\",\"message\":\"%s\"}",
                status, error, message.replace("\"", "'"));
        return Response.status(status).entity(json).type(MediaType.APPLICATION_JSON).build();
    }
}
