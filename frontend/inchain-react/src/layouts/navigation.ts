import type { UserRole } from "../features/auth/authTypes";
import { paths } from "../routes/paths";

export type NavigationItem = {
  label: string;
  to: string;
};

export const appRoles = {
  admin: "Admin",
  requester: "Requester",
  approver: "Approver",
} as const satisfies Record<string, UserRole>;

const navigationByRole: Record<string, NavigationItem[]> = {
  [appRoles.admin]: [
    { label: "Dashboard", to: paths.dashboard },
    { label: "Users", to: paths.users },
    { label: "Role Assignment", to: paths.roles },
    { label: "Document Types", to: paths.documentTypes },
    { label: "Approval Routes", to: paths.approvalRoutes },
    { label: "System Activity History", to: paths.systemActivityHistory },
  ],
  [appRoles.requester]: [
    { label: "Dashboard", to: paths.dashboard },
    { label: "My Requests", to: paths.requests },
    { label: "Create Request", to: paths.createRequest },
    { label: "Activity History", to: paths.activityHistory },
  ],
  [appRoles.approver]: [
    { label: "Dashboard", to: paths.dashboard },
    { label: "Pending Requests", to: paths.pendingRequests },
    { label: "Reviewed Requests", to: paths.reviewedRequests },
  ],
};

export function getNavigationItems(roles: UserRole[]): NavigationItem[] {
  const items = roles.flatMap((role) => navigationByRole[role] ?? []);
  const uniqueItems = new Map<string, NavigationItem>();

  for (const item of items) {
    uniqueItems.set(item.to, item);
  }

  return Array.from(uniqueItems.values());
}
