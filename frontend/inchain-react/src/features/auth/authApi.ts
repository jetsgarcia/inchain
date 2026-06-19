import apiClient from "../../lib/api/apiClient";
import type { CurrentUser, LoginRequest, LoginResponse } from "./authTypes";

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/login", credentials);
  return response.data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>("/manage/info");
  return response.data;
}
