import apiClient from "@/lib/api/apiClient";
import type { CurrentUser, LoginRequest, LoginResponse } from "@/features/auth/authTypes";

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/login", credentials);
  return response.data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>("/api/auth/me");
  return response.data;
}
