import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { isApiError, normalizeApiError, type ApiError } from "@/lib/api/apiError";
import { getCurrentUser, login as loginRequest } from "@/features/auth/authApi";
import { AuthContext, type AuthContextValue } from "@/features/auth/authContextValue";
import { clearAuthToken, getAuthToken, setAuthTokens } from "@/features/auth/authTokenStorage";
import type { CurrentUser, UserRole } from "@/features/auth/authTypes";

type AuthProviderProps = {
  children: ReactNode;
};

function toApiError(error: unknown): ApiError {
  return isApiError(error) ? error : normalizeApiError(error);
}

const knownRoleMap = new Map<string, UserRole>([
  ["admin", "Admin"],
  ["approver", "Approver"],
  ["requester", "Requester"],
]);

function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== "string") {
    return null;
  }

  const trimmedRole = role.trim();

  if (!trimmedRole) {
    return null;
  }

  return knownRoleMap.get(trimmedRole.toLowerCase()) ?? trimmedRole;
}

function getRolesFromUser(user: CurrentUser): UserRole[] {
  const roleValues = Array.isArray(user.roles) ? user.roles : [user.role];
  const normalizedRoles = roleValues
    .map(normalizeRole)
    .filter((role): role is UserRole => Boolean(role));

  return Array.from(new Set(normalizedRoles));
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
    async (email: string, password: string, rememberMe: boolean) => {
      setIsLoading(true);

      try {
        const response = await loginRequest({ email, password });

        if (response.accessToken) {
          setAuthTokens(
            response.accessToken,
            response.refreshToken,
            rememberMe ? "local" : "session",
          );
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
    [clearAuthState, loadCurrentUser],
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
