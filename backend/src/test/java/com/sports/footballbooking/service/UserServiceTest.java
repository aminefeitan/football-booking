package com.sports.footballbooking.service;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.sports.footballbooking.dto.CreateFieldManagerRequest;
import com.sports.footballbooking.dto.CreatedUserResponse;
import com.sports.footballbooking.dto.UpdatePasswordRequest;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.ForbiddenException;
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
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User adminUser;
    private User managerUser;
    private User playerUser;
    private UUID adminId;
    private UUID managerId;
    private UUID playerId;

    @BeforeEach
    void setUp() throws Exception {
        adminId = UUID.randomUUID();
        managerId = UUID.randomUUID();
        playerId = UUID.randomUUID();

        adminUser = new User("admin@example.com", BCrypt.withDefaults().hashToString(12, "AdminPass123!".toCharArray()), "Super", "Admin", null, User.Role.ADMIN);
        setId(adminUser, adminId);

        managerUser = new User("manager@example.com", BCrypt.withDefaults().hashToString(12, "ManagerPass123!".toCharArray()), "Field", "Manager", "+212600000000", User.Role.FIELD_MANAGER);
        setId(managerUser, managerId);

        playerUser = new User("player@example.com", BCrypt.withDefaults().hashToString(12, "PlayerPass123!".toCharArray()), "Hakim", "Ziyech", "+212611111111", User.Role.PLAYER);
        setId(playerUser, playerId);
    }

    private void setId(Object entity, UUID id) throws Exception {
        Field idField = entity.getClass().getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }

    @Test
    @DisplayName("Section B : createFieldManager génère un mdp temporaire de 14 caractères sans ambiguïtés et configure mustChangePassword=true")
    void testCreateFieldManagerSuccess() {
        CreateFieldManagerRequest req = new CreateFieldManagerRequest("newmanager@example.com", "Mehdi", "Benatia", "+212622222222");
        when(userRepository.existsByEmail("newmanager@example.com")).thenReturn(false);
        doAnswer(inv -> {
            User u = inv.getArgument(0);
            setId(u, UUID.randomUUID());
            return null;
        }).when(userRepository).persist(any(User.class));

        CreatedUserResponse res = userService.createFieldManager(req);

        assertNotNull(res);
        assertNotNull(res.temporaryPassword());
        assertEquals(14, res.temporaryPassword().length(), "Le mot de passe temporaire doit comporter exactement 14 caractères");

        // Aucun caractère ambigu : 0, O, 1, l, I
        String temp = res.temporaryPassword();
        assertFalse(temp.contains("0") || temp.contains("O") || temp.contains("1") || temp.contains("l") || temp.contains("I"),
                "Le mot de passe ne doit pas contenir de caractères ambigus (0, O, 1, l, I)");

        assertEquals("newmanager@example.com", res.user().email());
        assertEquals(User.Role.FIELD_MANAGER, res.user().role());
        assertTrue(res.user().mustChangePassword(), "mustChangePassword doit valoir true");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).persist(captor.capture());
        User saved = captor.getValue();
        assertTrue(saved.isMustChangePassword());
        assertEquals(User.Role.FIELD_MANAGER, saved.getRole());
    }

    @Test
    @DisplayName("Section B : createFieldManager échoue avec 409 si l'email existe déjà")
    void testCreateFieldManagerDuplicateEmail() {
        CreateFieldManagerRequest req = new CreateFieldManagerRequest("manager@example.com", "Mehdi", "Benatia", null);
        when(userRepository.existsByEmail("manager@example.com")).thenReturn(true);

        ClientErrorException ex = assertThrows(ClientErrorException.class, () -> userService.createFieldManager(req));
        assertEquals(409, ex.getResponse().getStatus());
        verify(userRepository, never()).persist(any());
    }

    @Test
    @DisplayName("Section B : resetPassword refuse une cible ADMIN (403) ou son propre compte (403)")
    void testResetPasswordRefusesAdminOrSelf() {
        // Self reset
        ForbiddenException ex1 = assertThrows(ForbiddenException.class, () -> userService.resetPassword(adminId, adminId));
        assertTrue(ex1.getMessage().contains("propre mot de passe"));

        // Target is another ADMIN
        UUID otherAdminId = UUID.randomUUID();
        User otherAdmin = new User("otheradmin@example.com", "hash", "Other", "Admin", null, User.Role.ADMIN);
        when(userRepository.findById(otherAdminId)).thenReturn(Optional.of(otherAdmin));

        ForbiddenException ex2 = assertThrows(ForbiddenException.class, () -> userService.resetPassword(adminId, otherAdminId));
        assertTrue(ex2.getMessage().contains("administrateur"));
    }

    @Test
    @DisplayName("Section B : resetPassword sur un manager réussit et force mustChangePassword=true")
    void testResetPasswordSuccess() {
        when(userRepository.findById(managerId)).thenReturn(Optional.of(managerUser));

        CreatedUserResponse res = userService.resetPassword(adminId, managerId);

        assertNotNull(res);
        assertNotNull(res.temporaryPassword());
        assertEquals(14, res.temporaryPassword().length());
        assertTrue(managerUser.isMustChangePassword(), "mustChangePassword doit passer à true");
        assertTrue(BCrypt.verifyer().verify(res.temporaryPassword().toCharArray(), managerUser.getPasswordHash()).verified);
    }

    @Test
    @DisplayName("Section B : updatePassword valide l'ancien mdp, refuse le nouveau identique et efface mustChangePassword")
    void testUpdatePasswordFlow() {
        playerUser.setMustChangePassword(true);
        when(userRepository.findById(playerId)).thenReturn(Optional.of(playerUser));

        // Ancien mot de passe erroné
        UpdatePasswordRequest wrongOldReq = new UpdatePasswordRequest("WrongPass123!", "NewPassword123!");
        assertThrows(BadRequestException.class, () -> userService.updatePassword(playerId, wrongOldReq));

        // Nouveau mot de passe identique à l'ancien
        UpdatePasswordRequest samePassReq = new UpdatePasswordRequest("PlayerPass123!", "PlayerPass123!");
        assertThrows(BadRequestException.class, () -> userService.updatePassword(playerId, samePassReq));

        // Succès
        UpdatePasswordRequest validReq = new UpdatePasswordRequest("PlayerPass123!", "BrandNewPassword123!");
        userService.updatePassword(playerId, validReq);

        assertFalse(playerUser.isMustChangePassword(), "mustChangePassword doit être effacé à false");
        assertTrue(BCrypt.verifyer().verify("BrandNewPassword123!".toCharArray(), playerUser.getPasswordHash()).verified);
    }

    @Test
    @DisplayName("Section B : updateUserStatus interdit de suspendre ou bannir soi-même ou un autre ADMIN (403)")
    void testUpdateUserStatusAdminProtection() {
        // Self status change
        ForbiddenException ex1 = assertThrows(ForbiddenException.class, () -> userService.updateUserStatus(adminId, adminId, User.Status.SUSPENDED));
        assertTrue(ex1.getMessage().contains("propre statut"));

        // Other admin status change
        UUID otherAdminId = UUID.randomUUID();
        User otherAdmin = new User("admin2@example.com", "hash", "Admin2", "Two", null, User.Role.ADMIN);
        when(userRepository.findById(otherAdminId)).thenReturn(Optional.of(otherAdmin));

        ForbiddenException ex2 = assertThrows(ForbiddenException.class, () -> userService.updateUserStatus(adminId, otherAdminId, User.Status.SUSPENDED));
        assertTrue(ex2.getMessage().contains("administrateur"));
    }
}
