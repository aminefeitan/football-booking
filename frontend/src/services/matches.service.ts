import { api } from "@/lib/api";
import type { Match, MatchParticipant } from "@/lib/types";
import { MOCK_MATCHES } from "@/lib/mock-data";

export async function getMatches(city?: string): Promise<Match[]> {
  try {
    const params = city ? `?city=${encodeURIComponent(city)}` : "";
    return await api<Match[]>(`/matches${params}`);
  } catch {
    return MOCK_MATCHES;
  }
}

export async function getMatchById(matchId: string): Promise<Match> {
  try {
    return await api<Match>(`/matches/${matchId}`);
  } catch {
    const match = MOCK_MATCHES.find((m) => m.id === matchId);
    if (!match) throw new Error("Match introuvable");
    return match;
  }
}

export async function createMatch(data: {
  title: string;
  description?: string;
  matchDate: string;
  durationMinutes: number;
  maxPlayers?: number;
  isPublic?: boolean;
  city?: string;
  fieldId?: string;
}): Promise<Match> {
  return api<Match>("/matches", { method: "POST", body: data, auth: true });
}

export async function joinMatch(matchId: string, teamSide?: "A" | "B"): Promise<MatchParticipant> {
  return api<MatchParticipant>(`/matches/${matchId}/join`, {
    method: "POST",
    body: { teamSide },
    auth: true,
  });
}

export async function leaveMatch(matchId: string): Promise<void> {
  return api<void>(`/matches/${matchId}/leave`, { method: "DELETE", auth: true });
}

export async function cancelMatch(matchId: string): Promise<Match> {
  return api<Match>(`/matches/${matchId}/cancel`, { method: "POST", auth: true });
}
