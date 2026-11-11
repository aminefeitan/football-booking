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
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
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

