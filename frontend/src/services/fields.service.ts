import { api, API_BASE, getStoredToken } from "@/lib/api";
import type { Field, FieldStatus, SlotStatus } from "@/lib/types";

export interface FieldFilters {
  city?: string;
  fieldType?: string;
  maxPrice?: number;
  indoor?: boolean;
  hasLights?: boolean;
}

export async function getFields(filters?: FieldFilters): Promise<Field[]> {
  const params = new URLSearchParams();
  if (filters?.city) params.set("city", filters.city);
  if (filters?.fieldType) params.set("fieldType", filters.fieldType);
  if (filters?.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters?.indoor !== undefined) params.set("indoor", String(filters.indoor));
  if (filters?.hasLights !== undefined) params.set("hasLights", String(filters.hasLights));

  const query = params.toString();
  return api<Field[]>(`/fields${query ? `?${query}` : ""}`);
}

export async function getFieldById(id: string): Promise<Field> {
  return api<Field>(`/fields/${id}`);
}

export async function getFieldSlots(id: string, date?: string): Promise<SlotStatus[]> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return api<SlotStatus[]>(`/fields/${id}/slots${query}`);
}

export async function getMyFields(): Promise<Field[]> {
  return api<Field[]>("/fields/mine");
}

export async function createField(data: Partial<Field>): Promise<Field> {
  return api<Field>("/fields", { method: "POST", body: data });
}

export async function updateField(id: string, data: Partial<Field>): Promise<Field> {
  return api<Field>(`/fields/${id}`, { method: "PUT", body: data });
}

export async function uploadFieldPhoto(fieldId: string, file: File): Promise<Field> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/fields/${fieldId}/photo`, {
    method: "PUT",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let msg = "Erreur lors du téléchargement de la photo";
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export async function deleteFieldPhoto(fieldId: string): Promise<void> {
  await api(`/fields/${fieldId}/photo`, { method: "DELETE" });
}

export async function getAdminFields(status?: FieldStatus): Promise<Field[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "?status=PENDING";
  return api<Field[]>(`/admin/fields${query}`);
}

export async function reviewField(id: string, status: FieldStatus): Promise<Field> {
  return api<Field>(`/admin/fields/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

