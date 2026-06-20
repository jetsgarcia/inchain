import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { isApiError, normalizeApiError, type ApiError } from "../../lib/api/apiError";
import { getCurrentUser, login as loginRequest } from "./authApi";
import { AuthContext, type AuthContextValue } from "./authContextValue";
import { clearAuthToken, getAuthToken, setAuthToken } from "./authTokenStorage";
import type { CurrentUser, LoginResponse, UserRole } from "./authTypes";

type AuthProviderProps = {
  children: ReactNode;
};

function toApiError(error: unknown): ApiError {
  return isApiError(error) ? error : normalizeApiError(error);
}

function getRolesFromUser(user: CurrentUser): UserRole[] {
  if (Array.isArray(user.roles)) {
    return user.roles;
  }

  if (user.role) {
    return [user.role];
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCurrentUser(value: unknown): value is CurrentUser {
  return isRecord(value);
}

function getUserFromLoginResponse(response: LoginResponse): CurrentUser | null {
  // TODO: ASP.NET Identity /login is token-only today; align this if the backend adds user data.
  return isCurrentUser(response.user) ? response.user : null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [hasStoredAuthToken] = useState(() => Boolean(getAuthToken()));
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(hasStoredAuthToken);
  const [error, setError] = useState<ApiError | null>(null);

  const setAuthenticatedUser = useCallback((currentUser: CurrentUser) => {
    setUser(currentUser);
    setRoles(getRolesFromUser(currentUser));
    setIsAuthenticated(true);
  }, []);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setRoles([]);
    setIsAuthenticated(false);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setAuthenticatedUser(currentUser);
      setError(null);
    } catch (caughtError) {
      const apiError = toApiError(caughtError);

      if (apiError.statusCode === 401) {
        clearAuthState();
      } else {
        setError(apiError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthState, setAuthenticatedUser]);

  const refreshCurrentUser = useCallback(async () => {
    setIsLoading(true);
    await loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (!hasStoredAuthToken) {
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      void loadCurrentUser();
    }, 0);

    return () => window.clearTimeout(refreshTimer);
  }, [hasStoredAuthToken, loadCurrentUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);

      try {
        const response = await loginRequest({ email, password });

        if (response.accessToken) {
          setAuthToken(response.accessToken);
        }

        const responseUser = getUserFromLoginResponse(response);

        if (responseUser) {
          setAuthenticatedUser(responseUser);
          setError(null);
          return;
        }

        await loadCurrentUser();
      } catch (caughtError) {
        const apiError = toApiError(caughtError);
        clearAuthState();
        setError(apiError);
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthState, loadCurrentUser, setAuthenticatedUser],
  );

  const logout = useCallback(async () => {
    clearAuthToken();
    clearAuthState();
    setError(null);
  }, [clearAuthState]);

  const clearAuthError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      roles,
      isAuthenticated,
      isLoading,
      error,
      login,
      logout,
      refreshCurrentUser,
      clearAuthError,
    }),
    [
      clearAuthError,
      error,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshCurrentUser,
      roles,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
