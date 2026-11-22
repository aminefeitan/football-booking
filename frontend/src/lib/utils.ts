import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "MAD"): string {
  return `${amount} ${currency}`;
}

function parseDateInput(input: string | number | undefined | null): Date | null {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input === "number") {
    const ms = input < 1e11 ? input * 1000 : input;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(input).trim();
  if (/^\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    const ms = num < 1e11 ? num * 1000 : num;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateStr: string | number): string {
  const d = parseDateInput(dateStr);
  if (!d) return typeof dateStr === "string" ? dateStr : "—";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTime(dateStr: string | number): string {
  const d = parseDateInput(dateStr);
  if (!d) {
    if (typeof dateStr === "string") {
      const timeMatch = dateStr.match(/(\d{2}:\d{2})/);
      return timeMatch ? timeMatch[1] : dateStr;
    }
    return "—";
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
    "5v5": "5 vs 5",
    "7v7": "7 vs 7",
    "11v11": "11 vs 11",
  };
  return map[type] ?? type;
}

export function formatSurface(surface: string): string {
  const map: Record<string, string> = {
    SYNTHETIC: "Synthétique",
    NATURAL_GRASS: "Gazon naturel",
    HYBRID: "Hybride",
    INDOOR: "Indoor",
    FUTSAL: "Futsal",
    ARTIFICIAL_TURF: "Pelouse artificielle",
  };
  return map[surface] ?? surface;
}

export function formatTime12h(timeStr?: string | number[]): string {
  if (!timeStr) return "";

  let h: number;
  let m: number;

  // Handle Jackson array format: [8, 0] or [14, 30]
  if (Array.isArray(timeStr)) {
    h = timeStr[0] ?? 0;
    m = timeStr[1] ?? 0;
  } else if (typeof timeStr === "string") {
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    if (isNaN(h)) return timeStr;
  } else {
    return "";
  }

  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function formatWorkingHours(
  open: string | number[] = "09:00",
  close: string | number[] = "23:00"
): string {
  const openStr = Array.isArray(open)
    ? `${open[0]?.toString().padStart(2, "0")}:${(open[1] ?? 0).toString().padStart(2, "0")}`
    : open;
  const closeStr = Array.isArray(close)
    ? `${close[0]?.toString().padStart(2, "0")}:${(close[1] ?? 0).toString().padStart(2, "0")}`
    : close;
  return `${openStr} - ${closeStr} (${formatTime12h(open)} - ${formatTime12h(close)})`;
}

