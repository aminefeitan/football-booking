import type { Match, User } from "./types";

export function fullName(user?: User | null) {
  if (!user) return "Unknown";
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
}

export function initials(user?: User | null) {
  if (!user) return "?";
  const a = user.firstName?.[0] ?? "";
  const b = user.lastName?.[0] ?? "";
  return (a + b).toUpperCase() || user.email.slice(0, 2).toUpperCase();
}

export function money(amount?: number, currency = "MAD") {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  return `${Number(amount).toFixed(2)} ${currency}`;
}

export function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(value: string) {
  const d = new Date(value);
  return d.toISOString();
}

export function matchIsPublic(match: Match) {
  return match.public ?? match.isPublic ?? true;
}

export function spotsLeft(match: Match) {
  const max = match.maxPlayers ?? 0;
  const taken = match.participants?.length ?? 0;
  return Math.max(0, max - taken);
}
