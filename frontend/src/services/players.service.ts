import { api } from "@/lib/api";
import type { Player } from "@/lib/types";
import { MOCK_USER } from "@/lib/mock-data";

export interface UpdateProfileRequest {
  preferredPosition?: string;
  skillLevel?: string;
  city?: string;
  bio?: string;
  available?: boolean;
}

export async function getMyProfile(): Promise<Player> {
  try {
    return await api<Player>("/players/me", { auth: true });
  } catch {
    return MOCK_USER as Player;
  }
}

export async function updateMyProfile(data: UpdateProfileRequest): Promise<Player> {
  return api<Player>("/players/me", {
    method: "PUT",
    body: data,
    auth: true,
  });
}

export async function searchPlayers(query?: string, city?: string): Promise<Player[]> {
  try {
    const sp = new URLSearchParams();
    if (query) sp.append("query", query);
    if (city) sp.append("city", city);
    const qStr = sp.toString() ? `?${sp.toString()}` : "";
    return await api<Player[]>(`/players${qStr}`);
  } catch {
    return [MOCK_USER as Player];
  }
}

export async function searchAvailablePlayers(city?: string): Promise<Player[]> {
  try {
    const params = city ? `?city=${encodeURIComponent(city)}` : "";
    return await api<Player[]>(`/players/available${params}`);
  } catch {
    return [MOCK_USER as Player];
  }
}
