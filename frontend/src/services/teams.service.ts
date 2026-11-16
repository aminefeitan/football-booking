import { api } from "@/lib/api";
import type { Team, TeamInvitation, TeamMember } from "@/lib/types";
import { MOCK_TEAMS } from "@/lib/mock-data";

export interface CreateTeamRequest {
  name: string;
  description?: string;
  city?: string;
  maxMembers: number;
}

export async function getTeams(city?: string): Promise<Team[]> {
  try {
    const params = city ? `?city=${encodeURIComponent(city)}` : "";
    return await api<Team[]>(`/teams${params}`);
  } catch {
    return MOCK_TEAMS;
  }
}

export async function getTeamById(id: string): Promise<Team> {
  try {
    return await api<Team>(`/teams/${id}`);
  } catch {
    const team = MOCK_TEAMS.find((t) => t.id === id);
    if (!team) throw new Error("Équipe introuvable");
    return team;
  }
}

export async function createTeam(data: CreateTeamRequest): Promise<Team> {
  return api<Team>("/teams", { method: "POST", body: data, auth: true });
}

export async function addTeamMember(teamId: string, data: { userId: string; role?: string; position?: string }): Promise<TeamMember> {
  return api<TeamMember>(`/teams/${teamId}/members`, { method: "POST", body: data, auth: true });
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  return api<void>(`/teams/${teamId}/members/${userId}`, { method: "DELETE", auth: true });
}

export async function getPendingInvitations(): Promise<TeamInvitation[]> {
  try {
    return await api<TeamInvitation[]>("/teams/invitations/pending", { auth: true });
  } catch {
    return [];
  }
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  return api<void>(`/teams/invitations/${invitationId}/accept`, { method: "POST", auth: true });
}

export async function invitePlayerToTeam(
  teamId: string,
  options: { invitedUserId?: string; playerName?: string; playerEmail?: string } | string
): Promise<TeamInvitation> {
  const body = typeof options === "string" ? { invitedUserId: options } : options;
  return api<TeamInvitation>(`/teams/${teamId}/invitations`, {
    method: "POST",
    body,
    auth: true,
  });
}
