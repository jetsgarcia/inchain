import { Routes } from '@angular/router';

import { paths } from './app.paths';
import { authGuard } from '@/shared/guards/auth.guard';
import { roleGuard } from '@/shared/guards/role.guard';
import { AuthService } from '@/features/auth/auth.service';
import { appRoles } from '@/layouts/navigation.config';
import { AppLayoutComponent } from '@/layouts/app-layout.component';
import { LoginComponent } from '@/pages/login/login.component';
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
        component: RoutePlaceholder,
        title: 'Dashboard',
        data: { title: 'Dashboard', path: paths.dashboard },
      },
      {
        path: routePath(paths.users),
        canActivate: [adminRoleGuard],
        component: RoutePlaceholder,
        title: 'Users',
        data: { title: 'Users', path: paths.users },
      },
      {
        path: routePath(paths.roles),
        canActivate: [adminRoleGuard],
        component: RoutePlaceholder,
        title: 'Roles',
        data: { title: 'Roles', path: paths.roles },
      },
      {
        path: routePath(paths.documentTypes),
        canActivate: [adminRoleGuard],
        component: RoutePlaceholder,
        title: 'Document Types',
        data: { title: 'Document Types', path: paths.documentTypes },
      },
      {
        path: routePath(paths.approvalRoutes),
        canActivate: [adminRoleGuard],
        component: RoutePlaceholder,
        title: 'Approval Routes',
        data: { title: 'Approval Routes', path: paths.approvalRoutes },
      },
      {
        path: routePath(paths.systemActivityHistory),
        canActivate: [adminRoleGuard],
        component: RoutePlaceholder,
        title: 'System Activity History',
        data: { title: 'System Activity History', path: paths.systemActivityHistory },
      },
      {
        path: routePath(paths.requests),
        canActivate: [requesterRoleGuard],
        component: RoutePlaceholder,
        title: 'Requests',
        data: { title: 'Requests', path: paths.requests },
      },
      {
        path: routePath(paths.createRequest),
        canActivate: [requesterRoleGuard],
        component: RoutePlaceholder,
        title: 'Create Request',
        data: { title: 'Create Request', path: paths.createRequest },
      },
      {
        path: routePath(paths.activityHistory),
        canActivate: [requesterRoleGuard],
        component: RoutePlaceholder,
        title: 'Activity History',
        data: { title: 'Activity History', path: paths.activityHistory },
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
