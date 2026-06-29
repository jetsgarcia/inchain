import type { UserRole } from '@/shared/models/auth.types';
import { paths } from '@/app.paths';

export type NavigationItem = {
  icon: string;
  label: string;
  to: string;
};

export const appRoles = {
  admin: 'Admin',
  requester: 'Requester',
  approver: 'Approver',
} as const satisfies Record<string, UserRole>;

const navigationByRole: Record<string, NavigationItem[]> = {
  [appRoles.admin]: [
    { icon: 'LayoutDashboard', label: 'Dashboard', to: paths.dashboard },
    { icon: 'Users', label: 'Users', to: paths.users },
    { icon: 'ShieldUser', label: 'Role Assignment', to: paths.roles },
    { icon: 'FileText', label: 'Document Types', to: paths.documentTypes },
    { icon: 'Route', label: 'Approval Routes', to: paths.approvalRoutes },
    {
      icon: 'History',
      label: 'System Activity History',
      to: paths.systemActivityHistory,
    },
  ],
  [appRoles.requester]: [
    { icon: 'LayoutDashboard', label: 'Dashboard', to: paths.dashboard },
    { icon: 'ClipboardList', label: 'My Requests', to: paths.requests },
    { icon: 'History', label: 'Activity History', to: paths.activityHistory },
  ],
  [appRoles.approver]: [
    { icon: 'LayoutDashboard', label: 'Dashboard', to: paths.dashboard },
    {
      icon: 'ClipboardClock',
      label: 'Pending Requests',
      to: paths.pendingRequests,
    },
    {
      icon: 'ClipboardCheck',
      label: 'Reviewed Requests',
      to: paths.reviewedRequests,
    },
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
