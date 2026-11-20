import { api } from "@/lib/api";
import type { ManagerStats, AdminStats, User, UserStatus, Role } from "@/lib/types";

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

export async function getAdminUsers(): Promise<User[]> {
  return api<User[]>("/admin/users");
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<User> {
  return api<User>(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  return api<User>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  });
}
