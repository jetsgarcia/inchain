import { Routes } from '@angular/router';

import { paths } from './app.paths';
import { authGuard } from '@/shared/guards/auth.guard';
import { roleGuard } from '@/shared/guards/role.guard';
import { appRoles } from '@/layouts/navigation.config';
import { AppLayoutComponent } from '@/layouts/app-layout.component';
import { LoginComponent } from '@/pages/login/login.component';
import { DashboardComponent } from '@/pages/dashboard/dashboard.component';
import { RequestListComponent } from '@/pages/requester/request-list/request-list.component';
import { RequestDetailComponent } from '@/pages/requester/request-detail/request-detail.component';
import { RequestFormComponent } from '@/pages/requester/request-form/request-form.component';
import { ActivityHistoryComponent } from '@/pages/requester/activity-history/activity-history.component';
import { AdminUsersComponent } from '@/pages/admin/users/users.component';
import { AdminDocumentTypesComponent } from '@/pages/admin/document-types/document-types.component';
import { AdminApprovalRoutesComponent } from '@/pages/admin/approval-routes/approval-routes.component';
import { AdminActivityLogsComponent } from '@/pages/admin/activity-logs/activity-logs.component';
import { AdminRolesComponent } from '@/pages/admin/roles/roles.component';
import { RoutePlaceholder } from './pages/route-placeholder/route-placeholder';

const adminRoleGuard = roleGuard([appRoles.admin]);
const requesterRoleGuard = roleGuard([appRoles.requester]);
const approverRoleGuard = roleGuard([appRoles.approver]);

const routePath = (path: string): string => {
  if (path === paths.root) {
    return '';
  }

  return path.replace(/^\//, '');
};

export const routes: Routes = [
  {
    path: routePath(paths.root),
    redirectTo: routePath(paths.dashboard),
    pathMatch: 'full',
  },
  {
    path: routePath(paths.login),
    component: LoginComponent,
    title: 'Login',
  },
  {
    path: routePath(paths.unauthorized),
    component: RoutePlaceholder,
    title: 'Unauthorized',
    data: { title: 'Unauthorized', path: paths.unauthorized },
  },
  {
    path: '',
    canActivate: [authGuard],
    component: AppLayoutComponent,
    children: [
      {
        path: routePath(paths.dashboard),
        component: DashboardComponent,
        title: 'Dashboard',
      },
      {
        path: routePath(paths.users),
        canActivate: [adminRoleGuard],
        component: AdminUsersComponent,
        title: 'Users',
      },
      {
        path: routePath(paths.roles),
        canActivate: [adminRoleGuard],
        component: AdminRolesComponent,
        title: 'Role Assignment',
      },
      {
        path: routePath(paths.documentTypes),
        canActivate: [adminRoleGuard],
        component: AdminDocumentTypesComponent,
        title: 'Document Types',
      },
      {
        path: routePath(paths.approvalRoutes),
        canActivate: [adminRoleGuard],
        component: AdminApprovalRoutesComponent,
        title: 'Approval Routes',
      },
      {
        path: routePath(paths.systemActivityHistory),
        canActivate: [adminRoleGuard],
        component: AdminActivityLogsComponent,
        title: 'System Activity History',
      },
      {
        path: routePath(paths.requests),
        canActivate: [requesterRoleGuard],
        children: [
          {
            path: '',
            component: RequestListComponent,
            title: 'My Requests',
          },
          {
            path: 'new',
            component: RequestFormComponent,
            title: 'New Request',
          },
          {
            path: ':id',
            component: RequestDetailComponent,
            title: 'Request Detail',
          },
          {
            path: ':id/edit',
            component: RequestFormComponent,
            title: 'Edit Request',
          },
        ],
      },
      {
        path: routePath(paths.createRequest),
        redirectTo: 'requests/new',
        pathMatch: 'full',
      },
      {
        path: routePath(paths.activityHistory),
        canActivate: [requesterRoleGuard],
        component: ActivityHistoryComponent,
        title: 'Activity History',
      },
      {
        path: routePath(paths.pendingRequests),
        canActivate: [approverRoleGuard],
        component: RoutePlaceholder,
        title: 'Pending Requests',
        data: { title: 'Pending Requests', path: paths.pendingRequests },
      },
      {
        path: routePath(paths.reviewedRequests),
        canActivate: [approverRoleGuard],
        component: RoutePlaceholder,
        title: 'Reviewed Requests',
        data: { title: 'Reviewed Requests', path: paths.reviewedRequests },
      },
    ],
  },
  {
    path: paths.notFound,
    component: RoutePlaceholder,
    title: 'Not Found',
    data: { title: 'Not Found', path: paths.notFound },
  },
];
