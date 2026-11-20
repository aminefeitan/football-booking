import type { User } from "./types";

export function fullName(user?: User | null) {
  if (!user) return "Inconnu";
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
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Casablanca",
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
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Casablanca",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toCasablancaIso(datetimeLocal: string): string {
  // Convert local input YYYY-MM-DDTHH:mm into ISO with Africa/Casablanca offset (+01:00 standard / +00:00 Ramadan)
  // Or standard ISO with local system offset
  const d = new Date(datetimeLocal);
  return d.toISOString();
}
