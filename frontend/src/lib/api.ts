import type { ApiErrorBody } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080/football-booking-1.0-SNAPSHOT/api/v1";

const USER_KEY = "fb_user";
const USER_ID_KEY = "fb_user_id";
const TOKEN_KEY = "fb_token";

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function persistSession(userId: string, userJson: string, token?: string) {
  localStorage.setItem(USER_ID_KEY, userId);
  localStorage.setItem(USER_KEY, userJson);
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearSession() {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUserJson(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, auth = false, headers, ...rest } = options;
  const userId = getStoredUserId();

  const h = new Headers(headers);
  if (!h.has("Accept")) h.set("Accept", "application/json");
  if (body !== undefined && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }
  const token = getStoredToken();
  if (token) {
    h.set("Authorization", `Bearer ${token}`);
  } else if ((auth || userId) && userId) {
    h.set("X-User-Id", userId);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err: unknown) {
    throw new ApiError(
      0,
      `Connexion impossible au serveur backend (${API_BASE}). Vérifiez que le serveur WildFly/Java est démarré sur le port 8080.`,
      "NETWORK_ERROR"
    );
  }

  if (res.status === 204) return undefined as T;

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
    const err = data as ApiErrorBody & { error?: string };
    const message =
      err?.message ||
      (typeof err?.error === "string" ? err.error : null) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, err?.error);
  }

  return data as T;
}
