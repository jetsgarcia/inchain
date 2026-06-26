import { Routes } from '@angular/router';

import { paths } from './app.paths';
import { RoutePlaceholder } from './pages/route-placeholder/route-placeholder';

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
    component: RoutePlaceholder,
    title: 'Login',
    data: { title: 'Login', path: paths.login },
  },
  {
    path: routePath(paths.dashboard),
    component: RoutePlaceholder,
    title: 'Dashboard',
    data: { title: 'Dashboard', path: paths.dashboard },
  },
  {
    path: routePath(paths.users),
    component: RoutePlaceholder,
    title: 'Users',
    data: { title: 'Users', path: paths.users },
  },
  {
    path: routePath(paths.roles),
    component: RoutePlaceholder,
    title: 'Roles',
    data: { title: 'Roles', path: paths.roles },
  },
  {
    path: routePath(paths.documentTypes),
    component: RoutePlaceholder,
    title: 'Document Types',
    data: { title: 'Document Types', path: paths.documentTypes },
  },
  {
    path: routePath(paths.approvalRoutes),
    component: RoutePlaceholder,
    title: 'Approval Routes',
    data: { title: 'Approval Routes', path: paths.approvalRoutes },
  },
  {
    path: routePath(paths.systemActivityHistory),
    component: RoutePlaceholder,
    title: 'System Activity History',
    data: { title: 'System Activity History', path: paths.systemActivityHistory },
  },
  {
    path: routePath(paths.createRequest),
    component: RoutePlaceholder,
    title: 'Create Request',
    data: { title: 'Create Request', path: paths.createRequest },
  },
  {
    path: routePath(paths.requests),
    component: RoutePlaceholder,
    title: 'Requests',
    data: { title: 'Requests', path: paths.requests },
  },
  {
    path: routePath(paths.activityHistory),
    component: RoutePlaceholder,
    title: 'Activity History',
    data: { title: 'Activity History', path: paths.activityHistory },
  },
  {
    path: routePath(paths.pendingRequests),
    component: RoutePlaceholder,
    title: 'Pending Requests',
    data: { title: 'Pending Requests', path: paths.pendingRequests },
  },
  {
    path: routePath(paths.reviewedRequests),
    component: RoutePlaceholder,
    title: 'Reviewed Requests',
    data: { title: 'Reviewed Requests', path: paths.reviewedRequests },
  },
  {
    path: routePath(paths.unauthorized),
    component: RoutePlaceholder,
    title: 'Unauthorized',
    data: { title: 'Unauthorized', path: paths.unauthorized },
  },
  {
    path: paths.notFound,
    component: RoutePlaceholder,
    title: 'Not Found',
    data: { title: 'Not Found', path: paths.notFound },
  },
];
