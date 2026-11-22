package com.sports.footballbooking.security;

import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.UserRepository;
import com.sports.footballbooking.resource.UserAdminResource;
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
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityAccessTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

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
        when(jwtService.validate("valid-player-jwt")).thenReturn(Optional.of(playerId));
        when(userRepository.findById(playerId)).thenReturn(Optional.of(playerUser));

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
    @DisplayName("Section A : Endpoints /fields non authentifiés -> 401 NotAuthorizedException obligatoire")
    void testUnauthenticatedFieldsRequireAuth() {
        when(requestContext.getMethod()).thenReturn("GET");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("fields");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn(null);

        assertThrows(NotAuthorizedException.class, () -> authFilter.filter(requestContext));
    }

    @Test
    @DisplayName("Section A : Endpoints /fields/{id} non authentifiés -> 401 NotAuthorizedException obligatoire")
    void testUnauthenticatedFieldDetailRequiresAuth() {
        when(requestContext.getMethod()).thenReturn("GET");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("fields/123");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn(null);

        assertThrows(NotAuthorizedException.class, () -> authFilter.filter(requestContext));
    }

    @Test
    @DisplayName("Section A : Endpoints /fields/{id}/slots non authentifiés -> 401 NotAuthorizedException obligatoire")
    void testUnauthenticatedFieldSlotsRequireAuth() {
        when(requestContext.getMethod()).thenReturn("GET");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("fields/123/slots");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn(null);

        assertThrows(NotAuthorizedException.class, () -> authFilter.filter(requestContext));
    }

    @Test
    @DisplayName("Section A : Endpoints /fields/{id}/photo non authentifiés -> 401 NotAuthorizedException obligatoire")
    void testUnauthenticatedFieldPhotoRequiresAuth() {
        when(requestContext.getMethod()).thenReturn("GET");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("fields/123/photo");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn(null);

        assertThrows(NotAuthorizedException.class, () -> authFilter.filter(requestContext));
    }

    @Test
    @DisplayName("Section A : OPTIONS, POST auth/login et POST auth/register sont les SEULES routes publiques")
    void testStrictPublicEndpoints() throws Exception {
        // OPTIONS
        when(requestContext.getMethod()).thenReturn("OPTIONS");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("anything");
        authFilter.filter(requestContext);
        verify(requestContext, never()).setSecurityContext(any());

        // POST auth/login
        when(requestContext.getMethod()).thenReturn("POST");
        when(uriInfo.getPath()).thenReturn("auth/login");
        authFilter.filter(requestContext);
        verify(requestContext, never()).setSecurityContext(any());

        // POST auth/register
        when(requestContext.getMethod()).thenReturn("POST");
        when(uriInfo.getPath()).thenReturn("auth/register");
        authFilter.filter(requestContext);
        verify(requestContext, never()).setSecurityContext(any());
    }

    @Test
    @DisplayName("Section B : mustChangePassword=true bloque toute ressource autre que GET users/me et PUT users/me/password")
    void testMustChangePasswordBlocksOtherEndpoints() {
        playerUser.setMustChangePassword(true);
        when(requestContext.getMethod()).thenReturn("GET");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("fields");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer valid-jwt");
        when(jwtService.validate("valid-jwt")).thenReturn(Optional.of(playerId));
        when(userRepository.findById(playerId)).thenReturn(Optional.of(playerUser));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> authFilter.filter(requestContext));
        assertEquals("Password change required", ex.getMessage());
    }

    @Test
    @DisplayName("Section B : mustChangePassword=true autorise GET users/me")
    void testMustChangePasswordAllowsGetUsersMe() throws Exception {
        playerUser.setMustChangePassword(true);
        when(requestContext.getMethod()).thenReturn("GET");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("users/me");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer valid-jwt");
        when(jwtService.validate("valid-jwt")).thenReturn(Optional.of(playerId));
        when(userRepository.findById(playerId)).thenReturn(Optional.of(playerUser));

        assertDoesNotThrow(() -> authFilter.filter(requestContext));
    }

    @Test
    @DisplayName("Section B : mustChangePassword=true autorise PUT users/me/password")
    void testMustChangePasswordAllowsPutUsersMePassword() throws Exception {
        playerUser.setMustChangePassword(true);
        when(requestContext.getMethod()).thenReturn("PUT");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("users/me/password");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer valid-jwt");
        when(jwtService.validate("valid-jwt")).thenReturn(Optional.of(playerId));
        when(userRepository.findById(playerId)).thenReturn(Optional.of(playerUser));

        assertDoesNotThrow(() -> authFilter.filter(requestContext));
    }

    @Test
    @DisplayName("Utilisateur non ACTIF (ex: SUSPENDED) -> 403 ForbiddenException")
    void testSuspendedUserForbidden() {
        playerUser.setStatus(User.Status.SUSPENDED);
        when(requestContext.getMethod()).thenReturn("GET");
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getPath()).thenReturn("bookings/me");
        when(requestContext.getHeaderString(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer valid-token");
        when(jwtService.validate("valid-token")).thenReturn(Optional.of(playerId));
        when(userRepository.findById(playerId)).thenReturn(Optional.of(playerUser));

        assertThrows(ForbiddenException.class, () -> authFilter.filter(requestContext));
    }
}
