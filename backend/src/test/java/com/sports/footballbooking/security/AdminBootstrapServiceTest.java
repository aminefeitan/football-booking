package com.sports.footballbooking.security;

import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.UserRepository;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminBootstrapService adminBootstrapService;

    @BeforeEach
    void setUp() {
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }

    @Test
    @DisplayName("Section C : Si un compte ADMIN existe déjà, ensureAdmin ne fait rien (idempotence)")
    void testEnsureAdminDoesNothingIfAdminExists() {
        when(userRepository.existsByRole(User.Role.ADMIN)).thenReturn(true);

        adminBootstrapService.ensureAdmin();

        verify(userRepository, never()).persist(any());
    }

    @Test
    @DisplayName("Section C : Par défaut, création de l'admin admin@footbook.ma avec mot de passe footbook123")
    void testEnsureAdminCreatesDefaultAdminWhenEnvAbsent() throws Exception {
        when(userRepository.existsByRole(User.Role.ADMIN)).thenReturn(false);
        setField(adminBootstrapService, "adminEmailConfig", Optional.empty());
        setField(adminBootstrapService, "adminPasswordConfig", Optional.empty());
        setField(adminBootstrapService, "adminFirstNameConfig", Optional.empty());
        setField(adminBootstrapService, "adminLastNameConfig", Optional.empty());

        when(userRepository.findByEmail("admin@footbook.ma")).thenReturn(Optional.empty());

        adminBootstrapService.ensureAdmin();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).persist(captor.capture());
        User created = captor.getValue();

        assertEquals("admin@footbook.ma", created.getEmail());
        assertEquals(User.Role.ADMIN, created.getRole());
        assertEquals(User.Status.ACTIVE, created.getStatus());
    }

    @Test
    @DisplayName("Section C : Si ADMIN_PASSWORD a moins de 8 caractères -> IllegalStateException")
    void testEnsureAdminThrowsIfPasswordTooShort() throws Exception {
        when(userRepository.existsByRole(User.Role.ADMIN)).thenReturn(false);
        setField(adminBootstrapService, "adminEmailConfig", Optional.of("admin@example.com"));
        setField(adminBootstrapService, "adminPasswordConfig", Optional.of("Short1"));

        assertThrows(IllegalStateException.class, () -> adminBootstrapService.ensureAdmin());
    }

    @Test
    @DisplayName("Section C : Création de l'ADMIN avec valeurs personnalisées si configurées")
    void testEnsureAdminCreatesCustomAdmin() throws Exception {
        when(userRepository.existsByRole(User.Role.ADMIN)).thenReturn(false);
        setField(adminBootstrapService, "adminEmailConfig", Optional.of("customadmin@footbook.com"));
        setField(adminBootstrapService, "adminPasswordConfig", Optional.of("CustomSecretPassword123!"));
        setField(adminBootstrapService, "adminFirstNameConfig", Optional.of("Super"));
        setField(adminBootstrapService, "adminLastNameConfig", Optional.of("Admin"));

        when(userRepository.findByEmail("customadmin@footbook.com")).thenReturn(Optional.empty());

        adminBootstrapService.ensureAdmin();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).persist(captor.capture());
        User created = captor.getValue();

        assertEquals("customadmin@footbook.com", created.getEmail());
        assertEquals(User.Role.ADMIN, created.getRole());
        assertEquals(User.Status.ACTIVE, created.getStatus());
    }
}
