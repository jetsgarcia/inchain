import type { UserRole } from "@/features/auth/authTypes";
import apiClient from "@/lib/api/apiClient";

export const adminUserRoles = ["Admin", "Approver", "Requester"] as const;

export type AdminUserRole = (typeof adminUserRoles)[number];

export type AdminUser = {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole | string;
  isDisabled: boolean;
};

export type CreateAdminUserRequest = {
  fullName: string;
  email: string;
  password: string;
  role: AdminUserRole;
};

export type UpdateAdminUserRequest = {
  fullName?: string;
  email?: string;
  role?: AdminUserRole;
};

export async function getAdminUsers(signal?: AbortSignal): Promise<AdminUser[]> {
  const response = await apiClient.get<AdminUser[]>("/api/admin/users", {
    signal,
  });
  return response.data;
}

export async function getAdminUser(
  userId: string,
  signal?: AbortSignal,
): Promise<AdminUser> {
  const response = await apiClient.get<AdminUser>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { signal },
  );
  return response.data;
}

export async function createAdminUser(
  data: CreateAdminUserRequest,
): Promise<AdminUser> {
  const response = await apiClient.post<AdminUser>("/api/admin/users", data);
  return response.data;
}

export async function setAdminUserDisabled(
  userId: string,
  isDisabled: boolean,
): Promise<void> {
  await apiClient.put(`/api/admin/users/${encodeURIComponent(userId)}/disabled`, {
    isDisabled,
  });
}

export async function updateAdminUserRole(
  userId: string,
  role: AdminUserRole,
): Promise<void> {
  await apiClient.put<never, void, UpdateAdminUserRequest>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { role },
  );
}
