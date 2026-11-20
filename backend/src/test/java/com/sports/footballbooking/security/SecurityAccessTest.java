package com.sports.footballbooking.security;

import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.resource.UserAdminResource;
import com.sports.footballbooking.service.AuthService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.core.UriInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityAccessTest {

    @Mock
    private AuthService authService;

    @Mock
    private ContainerRequestContext requestContext;

    @Mock
    private UriInfo uriInfo;

    @InjectMocks
    private AuthFilter authFilter;

    private User playerUser;
    private UUID playerId;

    @BeforeEach
    void setUp() throws Exception {
        playerId = UUID.randomUUID();
        playerUser = new User("player@example.com", "hash", "Bilal", "ElKhannouss", null, User.Role.PLAYER);
        Field idField = playerUser.getClass().getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(playerUser, playerId);
    }

    @Test
    @DisplayName("2. Contrôle d'accès : un utilisateur avec le rôle PLAYER n'a pas accès au rôle ADMIN")
    void testPlayerRoleCannotAccessAdmin() throws Exception {
        when(requestContext.getMethod()).thenReturn("GET");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("admin/users");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer valid-player-jwt");
        when(authService.authenticate("valid-player-jwt")).thenReturn(playerUser);

        ArgumentCaptor<SecurityContext> secCaptor = ArgumentCaptor.forClass(SecurityContext.class);

        authFilter.filter(requestContext);

        verify(requestContext).setSecurityContext(secCaptor.capture());
        SecurityContext capturedSec = secCaptor.getValue();

        assertNotNull(capturedSec);
        assertEquals(playerId.toString(), capturedSec.getUserPrincipal().getName());
        assertTrue(capturedSec.isUserInRole("PLAYER"), "L'utilisateur doit avoir le rôle PLAYER");
        assertFalse(capturedSec.isUserInRole("ADMIN"), "Un utilisateur PLAYER ne doit PAS être reconnu dans le rôle ADMIN");
        assertFalse(capturedSec.isUserInRole("FIELD_MANAGER"), "Un utilisateur PLAYER ne doit PAS être FIELD_MANAGER");
    }

    @Test
    @DisplayName("Vérification que UserAdminResource est protégée par @RolesAllowed('ADMIN')")
    void testUserAdminResourceAnnotation() {
        RolesAllowed annotation = UserAdminResource.class.getAnnotation(RolesAllowed.class);
        assertNotNull(annotation, "UserAdminResource doit porter l'annotation @RolesAllowed");
        assertArrayEquals(new String[]{"ADMIN"}, annotation.value(), "L'accès doit être strictement réservé à ADMIN");
    }

    @Test
    @DisplayName("Requête sur ressource protégée sans header Authorization -> 401 NotAuthorizedException")
    void testMissingAuthorizationHeader() {
        when(requestContext.getMethod()).thenReturn("GET");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("bookings/me");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn(null);

        assertThrows(NotAuthorizedException.class, () -> authFilter.filter(requestContext));
    }

    @Test
    @DisplayName("Utilisateur non ACTIF (ex: SUSPENDED) -> 403 ForbiddenException")
    void testSuspendedUserForbidden() {
        when(requestContext.getMethod()).thenReturn("GET");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("bookings/me");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer valid-token");
        when(authService.authenticate("valid-token")).thenThrow(new ForbiddenException("Compte suspendu"));

        assertThrows(ForbiddenException.class, () -> authFilter.filter(requestContext));
    }
}
