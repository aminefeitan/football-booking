import { api, persistSession, clearSession, getStoredUserJson } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";
import { MOCK_USER } from "@/lib/mock-data";

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
  } catch {
    // Mock login for dev
    const mockRes: AuthResponse = {
      token: "mock-jwt-token",
      user: MOCK_USER,
    };
    persistSession(mockRes.user.id, JSON.stringify(mockRes.user), mockRes.token);
    return mockRes;
  }
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await api<AuthResponse>("/auth/register", {
    method: "POST",
    body: data,
  });
  persistSession(res.user.id, JSON.stringify(res.user), res.token);
  return res;
}

export async function getMe(): Promise<User> {
  try {
    return await api<User>("/auth/me", { auth: true });
  } catch {
    const stored = getStoredUserJson();
    if (stored) return JSON.parse(stored) as User;
    return MOCK_USER;
  }
}

export function logout() {
  clearSession();
}

