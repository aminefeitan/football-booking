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

