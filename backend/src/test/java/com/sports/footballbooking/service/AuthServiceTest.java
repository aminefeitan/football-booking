package com.sports.footballbooking.service;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.sports.footballbooking.dto.AuthResponse;
import com.sports.footballbooking.dto.LoginRequest;
import com.sports.footballbooking.dto.RegisterRequest;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.UserRepository;
import com.sports.footballbooking.security.JwtService;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.core.Response;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    private void setId(Object entity, UUID id) throws Exception {
        Field idField = entity.getClass().getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }

    @Test
    @DisplayName("3. Inscription : l'inscription crée TOUJOURS un utilisateur avec le rôle PLAYER")
    void testRegisterAlwaysAssignsPlayerRole() {
        RegisterRequest req = new RegisterRequest(
                "newplayer@example.com",
                "Password123!",
                "Achraf",
                "Hakimi",
                "+212611223344"
        );

        when(userRepository.existsByEmail("newplayer@example.com")).thenReturn(false);
        doAnswer(inv -> {
            User u = inv.getArgument(0);
            setId(u, userId);
            return null;
        }).when(userRepository).persist(any(User.class));
        when(jwtService.generateToken(userId)).thenReturn("mock.jwt.token");

        AuthResponse res = authService.register(req);

        assertNotNull(res);
        assertEquals("mock.jwt.token", res.token());
        assertEquals("newplayer@example.com", res.user().email());
        assertEquals(User.Role.PLAYER, res.user().role());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).persist(captor.capture());
        User savedUser = captor.getValue();
        assertEquals(User.Role.PLAYER, savedUser.getRole(), "Le rôle doit être strictement PLAYER");
        assertEquals(User.Status.ACTIVE, savedUser.getStatus(), "Le statut initial doit être ACTIVE");
    }

    @Test
    @DisplayName("Inscription avec email existant -> 409 Conflict")
    void testRegisterDuplicateEmailConflict() {
        RegisterRequest req = new RegisterRequest("used@example.com", "Password123!", "Yassine", "Bounou", null);
        when(userRepository.existsByEmail("used@example.com")).thenReturn(true);

        ClientErrorException ex = assertThrows(ClientErrorException.class, () -> authService.register(req));
        assertEquals(Response.Status.CONFLICT.getStatusCode(), ex.getResponse().getStatus());
        verify(userRepository, never()).persist(any(User.class));
    }

    @Test
    @DisplayName("Connexion d'un utilisateur inactif ou banni -> 403 Forbidden")
    void testLoginInactiveUserForbidden() {
        String hash = BCrypt.withDefaults().hashToString(12, "Password123!".toCharArray());
        User inactiveUser = new User("inactive@example.com", hash, "Nayef", "Aguerd", null, User.Role.PLAYER);
        inactiveUser.setStatus(User.Status.BANNED);

        when(userRepository.findByEmail("inactive@example.com")).thenReturn(Optional.of(inactiveUser));

        LoginRequest req = new LoginRequest("inactive@example.com", "Password123!");
        assertThrows(ForbiddenException.class, () -> authService.login(req));
    }

    @Test
    @DisplayName("Connexion mot de passe incorrect -> 401 NotAuthorizedException")
    void testLoginBadPasswordUnauthorized() {
        String hash = BCrypt.withDefaults().hashToString(12, "CorrectPassword123!".toCharArray());
        User user = new User("user@example.com", hash, "Romain", "Saiss", null, User.Role.PLAYER);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        LoginRequest req = new LoginRequest("user@example.com", "WrongPassword!");
        assertThrows(NotAuthorizedException.class, () -> authService.login(req));
    }
}
