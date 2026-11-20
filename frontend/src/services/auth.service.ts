import { api, persistToken, clearToken } from "@/lib/api";
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
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await api<AuthResponse>("/auth/login", {
    method: "POST",
    body: data,
  });
  persistToken(res.token);
  return res;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await api<AuthResponse>("/auth/register", {
    method: "POST",
    body: data,
  });
  persistToken(res.token);
  return res;
}

export async function getMe(): Promise<User> {
  return api<User>("/users/me");
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return api<User>("/users/me", {
    method: "PUT",
    body: data,
  });
}

export async function updatePassword(data: UpdatePasswordRequest): Promise<void> {
  return api<void>("/users/me/password", {
    method: "PUT",
    body: data,
  });
}

export function logout() {
  clearToken();
}
