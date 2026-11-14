import { api } from "@/lib/api";
import type { Field } from "@/lib/types";
import { MOCK_FIELDS } from "@/lib/mock-data";

export interface FieldFilters {
  city?: string;
  fieldType?: string;
  maxPrice?: number;
  indoor?: boolean;
  hasLights?: boolean;
}

export async function getFields(filters?: FieldFilters): Promise<Field[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.city) params.set("city", filters.city);
    if (filters?.fieldType) params.set("fieldType", filters.fieldType);
    if (filters?.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters?.indoor !== undefined) params.set("indoor", String(filters.indoor));
    if (filters?.hasLights !== undefined) params.set("hasLights", String(filters.hasLights));

    const query = params.toString();
    return await api<Field[]>(`/fields${query ? `?${query}` : ""}`);
  } catch {
    // fallback mock
    let results = [...MOCK_FIELDS];
    if (filters?.city) {
      results = results.filter((f) =>
        f.city?.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    if (filters?.fieldType) {
      results = results.filter((f) => f.fieldType === filters.fieldType);
    }
    if (filters?.maxPrice) {
      results = results.filter((f) => f.pricePerHour <= filters.maxPrice!);
    }
    if (filters?.indoor !== undefined) {
      results = results.filter((f) => f.indoor === filters.indoor);
    }
    if (filters?.hasLights !== undefined) {
      results = results.filter((f) => f.hasLights === filters.hasLights);
    }
    return results;
  }
}

export async function getFieldById(id: string): Promise<Field> {
  try {
    return await api<Field>(`/fields/${id}`);
  } catch {
    const field = MOCK_FIELDS.find((f) => f.id === id);
    if (!field) throw new Error("Terrain non trouvé");
    return field;
  }
}

export async function createField(data: Omit<Field, "id" | "active" | "owner">): Promise<Field> {
  return api<Field>("/fields", { method: "POST", body: data, auth: true });
}

export async function updateField(id: string, data: Partial<Field>): Promise<Field> {
  return api<Field>(`/fields/${id}`, { method: "PUT", body: data, auth: true });
}

export async function deleteField(id: string): Promise<void> {
  return api<void>(`/fields/${id}`, { method: "DELETE", auth: true });
}

export interface SlotStatus {
  time: string;
  status: "available" | "reserved" | "last_places";
}

/**
 * Génère tous les créneaux horaires (tranches d'1h) compris dans l'intervalle de travail
 * du terrain (openTime -> closeTime).
 * Pour un nouveau terrain ou sans réservation, TOUS les créneaux sont disponibles ('available').
 */
export function generateFieldSlots(
  openTime: string = "09:00",
  closeTime: string = "23:00",
  reservedTimes: string[] = []
): SlotStatus[] {
  const [openHour] = openTime.split(":").map(Number);
  let [closeHour] = closeTime.split(":").map(Number);
  const startH = isNaN(openHour) ? 9 : openHour;
  let endH = isNaN(closeHour) ? 23 : closeHour;
  if (endH <= startH) {
    endH += 24; // Fermeture après minuit (ex. 00:00 -> 24)
  }

  const slots: SlotStatus[] = [];
  for (let h = startH; h < endH; h++) {
    const formatted = `${String(h % 24).padStart(2, "0")}:00`;
    const isReserved = reservedTimes.includes(formatted);
    slots.push({
      time: formatted,
      status: isReserved ? "reserved" : "available",
    });
  }
  return slots;
}

export async function getFieldSlots(
  fieldId: string,
  date?: string,
  fieldFallback?: Field
): Promise<SlotStatus[]> {
  try {
    const query = date ? `?date=${date}` : "";
    return await api<SlotStatus[]>(`/fields/${fieldId}/slots${query}`);
  } catch {
    const openTime = fieldFallback?.openTime || "09:00";
    const closeTime = fieldFallback?.closeTime || "23:00";
    return generateFieldSlots(openTime, closeTime, []);
  }
}

