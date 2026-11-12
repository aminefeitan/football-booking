import { api, persistSession, clearSession, getStoredUserJson } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";
import { MOCK_USER, MOCK_MANAGER } from "@/lib/mock-data";

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
    // Mode hors-ligne / Mock de développement
    const stored = getStoredUserJson();
    let user: User;

    if (stored) {
      user = JSON.parse(stored) as User;
      if (data.email) user.email = data.email;
    } else if (data.email.toLowerCase().includes("manager")) {
      user = { ...MOCK_MANAGER, email: data.email };
    } else {
      user = { ...MOCK_USER, email: data.email };
    }

    const mockRes: AuthResponse = {
      token: "mock-jwt-" + Date.now(),
      user,
    };
    persistSession(user.id, JSON.stringify(user), mockRes.token);
    return mockRes;
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
  } catch {
    // Mode hors-ligne / Mock : on crée le compte avec les vraies données saisies
    const isManager = data.role === "FIELD_MANAGER";
    const mockUser: User = {
      id: "user-" + Date.now(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role ?? "PLAYER",
      status: "ACTIVE",
      businessName: isManager ? "Complexe " + data.lastName : undefined,
      createdAt: new Date().toISOString(),
    };

    const mockRes: AuthResponse = {
      token: "mock-jwt-" + Date.now(),
      user: mockUser,
    };
    persistSession(mockUser.id, JSON.stringify(mockUser), mockRes.token);
    return mockRes;
  }
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
