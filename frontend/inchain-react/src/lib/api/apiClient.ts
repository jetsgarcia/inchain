import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  clearAuthToken,
  getAuthToken,
  getRefreshToken,
  setAuthTokens,
} from "@/features/auth/authTokenStorage";
import type { LoginResponse } from "@/features/auth/authTypes";
import { normalizeApiError } from "@/lib/api/apiError";

const API_BASE_URL = "https://localhost:7140";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _authToken?: string;
  _retry?: boolean;
};

let refreshRequest: Promise<string> | null = null;

function isAuthEndpoint(url?: string): boolean {
  if (!url) {
    return false;
  }

  try {
    const pathname = new URL(url, API_BASE_URL).pathname.replace(/\/+$/, "");
    return pathname === "/login" || pathname === "/refresh";
  } catch {
    return url === "/login" || url === "/refresh";
  }
}

function setAuthorizationHeader(
  config: RetriableRequestConfig,
  token: string,
): void {
  config.headers.Authorization = `Bearer ${token}`;
  config._authToken = token;
}

async function requestNewAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("Missing refresh token.");
  }

  const response = await refreshClient.post<LoginResponse>("/refresh", {
    refreshToken,
  });
  const accessToken = response.data.accessToken;

  if (!accessToken) {
    throw new Error("Refresh response did not include an access token.");
  }

  setAuthTokens(accessToken, response.data.refreshToken ?? refreshToken);
  return accessToken;
}

function refreshAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = requestNewAccessToken().finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
}

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  const authConfig = config as RetriableRequestConfig;

  if (token) {
    setAuthorizationHeader(authConfig, token);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = normalizeApiError(error);

    if (!axios.isAxiosError(error)) {
      return Promise.reject(apiError);
    }

    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      apiError.statusCode === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      const currentToken = getAuthToken();

      originalRequest._retry = true;

      if (currentToken && currentToken !== originalRequest._authToken) {
        setAuthorizationHeader(originalRequest, currentToken);
        return apiClient(originalRequest);
      }

      if (getRefreshToken()) {
        try {
          const refreshedAccessToken = await refreshAccessToken();
          setAuthorizationHeader(originalRequest, refreshedAccessToken);
          return apiClient(originalRequest);
        } catch (refreshError) {
          const refreshApiError = normalizeApiError(refreshError);

          if (
            refreshApiError.statusCode === 400 ||
            refreshApiError.statusCode === 401
          ) {
            clearAuthToken();
          }

          return Promise.reject(refreshApiError);
        }
      }
    }

    if (apiError.statusCode === 401) {
      clearAuthToken();
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
