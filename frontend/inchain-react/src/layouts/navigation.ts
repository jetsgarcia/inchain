import {
  ClipboardCheckIcon,
  ClipboardClockIcon,
  ClipboardListIcon,
  ClipboardPlusIcon,
  FileTextIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  RouteIcon,
  ShieldUserIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/features/auth/authTypes";
import { paths } from "@/routes/paths";

export type NavigationItem = {
  icon: LucideIcon;
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
    { icon: LayoutDashboardIcon, label: "Dashboard", to: paths.dashboard },
    { icon: UsersIcon, label: "Users", to: paths.users },
    { icon: ShieldUserIcon, label: "Role Assignment", to: paths.roles },
    { icon: FileTextIcon, label: "Document Types", to: paths.documentTypes },
    { icon: RouteIcon, label: "Approval Routes", to: paths.approvalRoutes },
    { icon: HistoryIcon, label: "System Activity History", to: paths.systemActivityHistory },
  ],
  [appRoles.requester]: [
    { icon: LayoutDashboardIcon, label: "Dashboard", to: paths.dashboard },
    { icon: ClipboardListIcon, label: "My Requests", to: paths.requests },
    { icon: ClipboardPlusIcon, label: "Create Request", to: paths.createRequest },
    { icon: HistoryIcon, label: "Activity History", to: paths.activityHistory },
  ],
  [appRoles.approver]: [
    { icon: LayoutDashboardIcon, label: "Dashboard", to: paths.dashboard },
    { icon: ClipboardClockIcon, label: "Pending Requests", to: paths.pendingRequests },
    { icon: ClipboardCheckIcon, label: "Reviewed Requests", to: paths.reviewedRequests },
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
