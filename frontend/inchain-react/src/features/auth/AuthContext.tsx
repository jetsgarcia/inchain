import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isApiError, normalizeApiError, type ApiError } from "../../lib/api/apiError";
import { getCurrentUser, login as loginRequest } from "./authApi";
import { clearAuthToken, getAuthToken, setAuthToken } from "./authTokenStorage";
import type { CurrentUser, LoginResponse, UserRole } from "./authTypes";

type AuthContextValue = {
  user: CurrentUser | null;
  roles: UserRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  clearAuthError: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

  // TODO: Confirm whether the backend current-user endpoint will include roles.
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
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  const refreshCurrentUser = useCallback(async () => {
    setIsLoading(true);

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

  useEffect(() => {
    if (!getAuthToken()) {
      clearAuthState();
      setIsLoading(false);
      return;
    }

    void refreshCurrentUser();
  }, [clearAuthState, refreshCurrentUser]);

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

        await refreshCurrentUser();
      } catch (caughtError) {
        const apiError = toApiError(caughtError);
        clearAuthState();
        setError(apiError);
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthState, refreshCurrentUser, setAuthenticatedUser],
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
