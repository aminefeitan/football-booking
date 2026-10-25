package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "team_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"team_id", "user_id"})
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@NamedQueries({
        @NamedQuery(name = "TeamMember.findByTeam",
                query = "SELECT tm FROM TeamMember tm JOIN FETCH tm.user WHERE tm.team.id = :teamId"),
        @NamedQuery(name = "TeamMember.findByUser",
                query = "SELECT tm FROM TeamMember tm JOIN FETCH tm.team WHERE tm.user.id = :userId"),
        @NamedQuery(name = "TeamMember.findByTeamAndUser",
                query = "SELECT tm FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.user.id = :userId")
})
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "members"})
    private Team team;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User user;

    @Size(max = 20)
    @Column(nullable = false, length = 20)
    private String role = "MEMBER"; // CAPTAIN, MEMBER

    @Size(max = 50)
    @Column(length = 50)
    private String position;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private OffsetDateTime joinedAt;

    protected TeamMember() {}

    public TeamMember(Team team, User user, String role, String position) {
        this.team = team;
        this.user = user;
        this.role = (role != null) ? role : "MEMBER";
        this.position = position;
    }

    @PrePersist
    protected void onCreate() {
        this.joinedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public OffsetDateTime getJoinedAt() { return joinedAt; }
}
