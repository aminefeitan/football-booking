package com.sports.footballbooking.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "team_members", uniqueConstraints = {
    @UniqueConstraint(name = "uq_team_members_team_user", columnNames = {"team_id", "user_id"})
})
public class TeamMember extends BaseEntity {

    public enum TeamRole {
        CAPTAIN,
        MEMBER
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TeamRole role = TeamRole.MEMBER;

    @Column(name = "joined_at", nullable = false)
    private OffsetDateTime joinedAt;

    public TeamMember() {
    }

    public TeamMember(Team team, User user, TeamRole role) {
        this.team = team;
        this.user = user;
        this.role = role != null ? role : TeamRole.MEMBER;
        this.joinedAt = OffsetDateTime.now();
    }

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (this.joinedAt == null) {
            this.joinedAt = OffsetDateTime.now();
        }
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public TeamRole getRole() {
        return role;
    }

    public void setRole(TeamRole role) {
        this.role = role;
    }

    public OffsetDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(OffsetDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }
}
