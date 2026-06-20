import axios from "axios";
import {
  clearAuthToken,
  getAuthToken,
} from "@/features/auth/authTokenStorage";
import { normalizeApiError } from "@/lib/api/apiError";

const apiClient = axios.create({
  baseURL: "https://localhost:7140",
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeApiError(error);

    if (apiError.statusCode === 401) {
      clearAuthToken();
      // TODO: Let auth state or routing handle redirects after auth state exists.
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
