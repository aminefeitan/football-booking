package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "match_participants", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"match_id", "user_id"})
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@NamedQueries({
        @NamedQuery(name = "MatchParticipant.findByMatch",
                query = "SELECT mp FROM MatchParticipant mp JOIN FETCH mp.user WHERE mp.match.id = :matchId"),
        @NamedQuery(name = "MatchParticipant.findByUser",
                query = "SELECT mp FROM MatchParticipant mp JOIN FETCH mp.match WHERE mp.user.id = :userId"),
        @NamedQuery(name = "MatchParticipant.findByMatchAndUser",
                query = "SELECT mp FROM MatchParticipant mp WHERE mp.match.id = :matchId AND mp.user.id = :userId")
})
public class MatchParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "match_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "participants"})
    private Match match;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User user;

    @Size(max = 20)
    @Column(nullable = false, length = 20)
    private String status = "REGISTERED"; // REGISTERED, CONFIRMED, DECLINED

    @Size(max = 10)
    @Column(name = "team_side", length = 10)
    private String teamSide; // A, B

    @Column(name = "joined_at", nullable = false, updatable = false)
    private OffsetDateTime joinedAt;

    protected MatchParticipant() {}

    public MatchParticipant(Match match, User user, String teamSide) {
        this.match = match;
        this.user = user;
        this.teamSide = teamSide;
        this.status = "REGISTERED";
    }

    @PrePersist
    protected void onCreate() {
        this.joinedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public Match getMatch() { return match; }
    public void setMatch(Match match) { this.match = match; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTeamSide() { return teamSide; }
    public void setTeamSide(String teamSide) { this.teamSide = teamSide; }
    public OffsetDateTime getJoinedAt() { return joinedAt; }
}
