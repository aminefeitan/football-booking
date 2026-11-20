import { api } from "@/lib/api";
import type { Match } from "@/lib/types";

export interface CreateMatchData {
  homeTeamId: string;
  awayTeamId: string;
  startAt: string;
  durationMinutes: number;
}

export async function createMatch(data: CreateMatchData): Promise<Match> {
  return api<Match>("/matches", {
    method: "POST",
    body: data,
  });
}

export async function getMyMatches(): Promise<Match[]> {
  return api<Match[]>("/matches/me");
}

export async function getMatchById(id: string): Promise<Match> {
  return api<Match>(`/matches/${id}`);
}

export async function cancelMatch(id: string): Promise<void> {
  return api<void>(`/matches/${id}/cancel`, {
    method: "PATCH",
  });
}
