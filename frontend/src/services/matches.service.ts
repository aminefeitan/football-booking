import { api } from "@/lib/api";
import type { Match } from "@/lib/types";
import { MOCK_MATCHES } from "@/lib/mock-data";

export async function getMatches(city?: string): Promise<Match[]> {
  try {
    const params = city ? `?city=${encodeURIComponent(city)}` : "";
    return await api<Match[]>(`/matches${params}`);
  } catch {
    return MOCK_MATCHES;
  }
}

export async function createMatch(data: Partial<Match>): Promise<Match> {
  return api<Match>("/matches", { method: "POST", body: data, auth: true });
}

export async function joinMatch(matchId: string): Promise<void> {
  return api<void>(`/matches/${matchId}/join`, { method: "POST", auth: true });
}

export async function leaveMatch(matchId: string): Promise<void> {
  return api<void>(`/matches/${matchId}/leave`, { method: "DELETE", auth: true });
}

