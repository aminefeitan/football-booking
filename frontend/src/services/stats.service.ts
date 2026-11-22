import { api } from "@/lib/api";
import type {
  ManagerStats,
  AdminStats,
  User,
  UserStatus,
  CreateFieldManagerRequest,
  CreatedUserResponse,
} from "@/lib/types";

export async function getManagerStats(from?: string, to?: string): Promise<ManagerStats> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return api<ManagerStats>(`/stats/manager${query ? `?${query}` : ""}`);
}

export async function getAdminStats(): Promise<AdminStats> {
  return api<AdminStats>("/stats/admin");
}

export async function getAdminUsers(role?: string): Promise<User[]> {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  return api<User[]>(`/admin/users${query}`);
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<User> {
  return api<User>(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export async function createFieldManager(data: CreateFieldManagerRequest): Promise<CreatedUserResponse> {
  return api<CreatedUserResponse>("/admin/users/field-managers", {
    method: "POST",
    body: data,
  });
}

export async function resetUserPassword(id: string): Promise<CreatedUserResponse> {
  return api<CreatedUserResponse>(`/admin/users/${id}/reset-password`, {
    method: "POST",
  });
}
