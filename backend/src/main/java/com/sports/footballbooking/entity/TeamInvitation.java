package com.sports.footballbooking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Represents an invitation for a player to join a football team.
 */
@Entity
@Table(name = "team_invitations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"team_id", "invited_user_id"})
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TeamInvitation extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "members"})
    private Team team;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "invited_user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User invitedUser;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "invited_by_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User invitedBy;

    @NotNull
    @Size(max = 20)
    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, ACCEPTED, DECLINED

    public TeamInvitation() {}

    public TeamInvitation(Team team, User invitedUser, User invitedBy) {
        this.team = team;
        this.invitedUser = invitedUser;
        this.invitedBy = invitedBy;
        this.status = "PENDING";
    }

    public void accept() {
        this.status = "ACCEPTED";
    }

    public void decline() {
        this.status = "DECLINED";
    }

    // Getters and Setters
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public User getInvitedUser() { return invitedUser; }
    public void setInvitedUser(User invitedUser) { this.invitedUser = invitedUser; }
    public User getInvitedBy() { return invitedBy; }
    public void setInvitedBy(User invitedBy) { this.invitedBy = invitedBy; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
