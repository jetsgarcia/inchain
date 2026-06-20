import { createContext } from "react";
import type { ApiError } from "@/lib/api/apiError";
import type { CurrentUser, UserRole } from "@/features/auth/authTypes";

export type AuthContextValue = {
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

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
