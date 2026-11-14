import { api, persistSession, clearSession, getStoredUserJson, ApiError } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: "PLAYER" | "FIELD_MANAGER";
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  try {
    const res = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: data,
    });
    persistSession(res.user.id, JSON.stringify(res.user), res.token);
    return res;
  } catch (err: unknown) {
    // Si le serveur backend a répondu avec une erreur HTTP (ex: 400, 401, 409...),
    // propager l'erreur telle quelle.
    if (err instanceof ApiError) {
      throw err;
    }
    // Erreur réseau / serveur inaccessible
    throw new Error(
      "Impossible de joindre le serveur. Vérifiez que le backend est démarré."
    );
  }
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  try {
    const res = await api<AuthResponse>("/auth/register", {
      method: "POST",
      body: data,
    });
    persistSession(res.user.id, JSON.stringify(res.user), res.token);
    return res;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Erreur réseau / serveur inaccessible
    throw new Error(
      "Impossible de joindre le serveur. Vérifiez que le backend est démarré."
    );
  }
}

export async function getMe(): Promise<User> {
  try {
    return await api<User>("/auth/me", { auth: true });
  } catch {
    // Fallback : lire l'utilisateur stocké en session locale
    const stored = getStoredUserJson();
    if (stored) return JSON.parse(stored) as User;
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }
}

export function logout() {
  clearSession();
}
