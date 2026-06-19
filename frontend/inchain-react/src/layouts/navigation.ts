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
    { label: "Users", to: paths.adminUsers },
    { label: "Role Assignment", to: paths.adminRoles },
    { label: "Document Types", to: paths.adminDocumentTypes },
    { label: "Approval Routes", to: paths.adminApprovalRoutes },
    { label: "System Activity History", to: paths.adminActivityLogs },
  ],
  [appRoles.requester]: [
    { label: "Dashboard", to: paths.dashboard },
    { label: "My Requests", to: paths.requesterRequests },
    { label: "Create Request", to: paths.requesterCreateRequest },
    { label: "Activity History", to: paths.requesterActivityHistory },
  ],
  [appRoles.approver]: [
    { label: "Dashboard", to: paths.dashboard },
    { label: "Pending Requests", to: paths.approverPending },
    { label: "Reviewed Requests", to: paths.approverReviewed },
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
