import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // Si c'est juste "YYYY-MM-DD", essayer de parser
    return dateStr;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // Si dateStr est déjà un horaire comme "19:00" ou a un format spécial
    const timeMatch = dateStr.match(/(\d{2}:\d{2})/);
    return timeMatch ? timeMatch[1] : dateStr;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatFieldType(type: string): string {
  const map: Record<string, string> = {
    FIVE_ASIDE: "5 vs 5",
    SEVEN_ASIDE: "7 vs 7",
    ELEVEN_ASIDE: "11 vs 11",
  };
  return map[type] ?? type;
}

export function formatSurface(surface: string): string {
  const map: Record<string, string> = {
    SYNTHETIC: "Synthétique",
    NATURAL_GRASS: "Gazon naturel",
    INDOOR: "Indoor",
    FUTSAL: "Futsal",
  };
  return map[surface] ?? surface;
}

export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function formatWorkingHours(open = "09:00", close = "23:00"): string {
  return `${open} - ${close} (${formatTime12h(open)} - ${formatTime12h(close)})`;
}

