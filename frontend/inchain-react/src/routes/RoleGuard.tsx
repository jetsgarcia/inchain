import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import type { UserRole } from "@/features/auth/authTypes";
import { useAuth } from "@/features/auth/useAuth";
import { paths } from "@/routes/paths";

type RoleGuardProps = {
  allowedRoles: UserRole[];
  children?: ReactNode;
};

function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { roles } = useAuth();
  const hasAllowedRole = roles.some((role) => allowedRoles.includes(role));

  if (!hasAllowedRole) {
    return <Navigate to={paths.unauthorized} replace />;
  }

  return children ?? <Outlet />;
}

export default RoleGuard;
