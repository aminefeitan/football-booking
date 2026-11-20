import type { ApiErrorBody } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080/football-booking-1.0-SNAPSHOT/api/v1";

const TOKEN_KEY = "fb_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function persistToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const h = new Headers(headers);
  if (!h.has("Accept")) h.set("Accept", "application/json");
  if (body !== undefined && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }

  const token = getStoredToken();
  if (token) {
    h.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      `Connexion impossible au serveur backend (${API_BASE}). Vérifiez que le serveur est démarré.`
    );
  }

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
      window.location.href = "/auth";
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const err = data as ApiErrorBody;
    const message = err?.message || `Erreur requête (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}
