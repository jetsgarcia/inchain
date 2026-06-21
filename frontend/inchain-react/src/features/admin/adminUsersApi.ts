import type { UserRole } from "@/features/auth/authTypes";
import apiClient from "@/lib/api/apiClient";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole | string;
  isDisabled: boolean;
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