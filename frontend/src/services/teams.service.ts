import { api } from "@/lib/api";
import type { Team, TeamSummary, TeamInvitation } from "@/lib/types";

export interface CreateTeamData {
  name: string;
  description?: string;
}

export async function createTeam(data: CreateTeamData): Promise<Team> {
  return api<Team>("/teams", {
    method: "POST",
    body: data,
  });
}

export async function getMyTeams(): Promise<Team[]> {
  return api<Team[]>("/teams/me");
}

export async function getTeamById(id: string): Promise<Team> {
  return api<Team>(`/teams/${id}`);
}

export async function searchTeams(name?: string): Promise<TeamSummary[]> {
  const query = name ? `?name=${encodeURIComponent(name)}` : "";
  return api<TeamSummary[]>(`/teams${query}`);
}

export async function inviteMember(teamId: string, email: string): Promise<TeamInvitation> {
  return api<TeamInvitation>(`/teams/${teamId}/invitations`, {
    method: "POST",
    body: { email },
  });
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  return api<void>(`/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
  });
}

export async function getMyInvitations(): Promise<TeamInvitation[]> {
  return api<TeamInvitation[]>("/invitations/me");
}

export async function acceptInvitation(id: string): Promise<void> {
  return api<void>(`/invitations/${id}/accept`, {
    method: "POST",
  });
}

export async function declineInvitation(id: string): Promise<void> {
  return api<void>(`/invitations/${id}/decline`, {
    method: "POST",
  });
}
