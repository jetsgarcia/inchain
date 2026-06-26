export const paths = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  users: '/users',
  roles: '/roles',
  documentTypes: '/document-types',
  approvalRoutes: '/approval-routes',
  systemActivityHistory: '/system-activity-history',
  requests: '/requests',
  createRequest: '/requests/new',
  activityHistory: '/activity-history',
  pendingRequests: '/pending-requests',
  reviewedRequests: '/reviewed-requests',
  unauthorized: '/unauthorized',
  notFound: '**',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
