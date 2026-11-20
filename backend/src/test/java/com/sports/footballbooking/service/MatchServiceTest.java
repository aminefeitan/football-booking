package com.sports.footballbooking.service;

import com.sports.footballbooking.dto.CreateMatchRequest;
import com.sports.footballbooking.dto.MatchResponse;
import com.sports.footballbooking.entity.Match;
import com.sports.footballbooking.entity.Team;
import com.sports.footballbooking.entity.User;
import com.sports.footballbooking.repository.MatchRepository;
import com.sports.footballbooking.repository.TeamMemberRepository;
import com.sports.footballbooking.repository.TeamRepository;
import com.sports.footballbooking.repository.UserRepository;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchServiceTest {

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MatchService matchService;

    private User captain;
    private Team homeTeam;
    private Team awayTeam;
    private UUID captainId;
    private UUID homeTeamId;
    private UUID awayTeamId;

    @BeforeEach
    void setUp() throws Exception {
        captainId = UUID.randomUUID();
        homeTeamId = UUID.randomUUID();
        awayTeamId = UUID.randomUUID();

        captain = new User("captain@example.com", "hash", "Achraf", "Hakimi", null, User.Role.PLAYER);
        setId(captain, captainId);

        homeTeam = new Team("PSG", "Paris");
        setId(homeTeam, homeTeamId);

        awayTeam = new Team("OM", "Marseille");
        setId(awayTeam, awayTeamId);
    }

    private void setId(Object entity, UUID id) throws Exception {
        Field idField = entity.getClass().getSuperclass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }

    @Test
    @DisplayName("6. Match avec homeTeam == awayTeam -> 400 BadRequest")
    void testSameTeamThrows400() {
        OffsetDateTime future = OffsetDateTime.now().plusDays(2);
        CreateMatchRequest req = new CreateMatchRequest(homeTeamId, homeTeamId, future, 90);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                matchService.createMatch(captainId, req));
        assertTrue(ex.getMessage().contains("distinctes"));
        verify(matchRepository, never()).persist(any(Match.class));
    }

    @Test
    @DisplayName("6. Non-capitaine de l'équipe à domicile -> 403 Forbidden")
    void testNonCaptainCannotCreateMatch() {
        OffsetDateTime future = OffsetDateTime.now().plusDays(2);
        CreateMatchRequest req = new CreateMatchRequest(homeTeamId, awayTeamId, future, 90);

        when(teamMemberRepository.isCaptain(homeTeamId, captainId)).thenReturn(false);

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                matchService.createMatch(captainId, req));
        assertTrue(ex.getMessage().contains("Seul le capitaine"));
        verify(matchRepository, never()).persist(any(Match.class));
    }

    @Test
    @DisplayName("6. Capitaine crée un match avec succès")
    void testCaptainCreatesMatchSuccess() {
        OffsetDateTime future = OffsetDateTime.now().plusDays(2);
        CreateMatchRequest req = new CreateMatchRequest(homeTeamId, awayTeamId, future, 90);

        when(teamMemberRepository.isCaptain(homeTeamId, captainId)).thenReturn(true);
        when(userRepository.findById(captainId)).thenReturn(Optional.of(captain));
        when(teamRepository.findById(homeTeamId)).thenReturn(Optional.of(homeTeam));
        when(teamRepository.findById(awayTeamId)).thenReturn(Optional.of(awayTeam));

        MatchResponse res = matchService.createMatch(captainId, req);

        assertNotNull(res);
        assertEquals(homeTeamId, res.homeTeamId());
        assertEquals(awayTeamId, res.awayTeamId());
        assertEquals(Match.MatchStatus.PLANNED, res.status());
        verify(matchRepository, times(1)).persist(any(Match.class));
    }
}
