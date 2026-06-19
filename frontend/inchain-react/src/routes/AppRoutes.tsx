import { Navigate, Route, Routes } from "react-router";
import AppLayout from "../layouts/AppLayout";
import { appRoles } from "../layouts/navigation";
import AdminActivityLogsPage from "../features/admin/pages/AdminActivityLogsPage";
import AdminApprovalRoutesPage from "../features/admin/pages/AdminApprovalRoutesPage";
import AdminDocumentTypesPage from "../features/admin/pages/AdminDocumentTypesPage";
import AdminRolesPage from "../features/admin/pages/AdminRolesPage";
import AdminUsersPage from "../features/admin/pages/AdminUsersPage";
import ApproverPendingPage from "../features/approver/pages/ApproverPendingPage";
import ApproverReviewedPage from "../features/approver/pages/ApproverReviewedPage";
import RequesterActivityHistoryPage from "../features/requester/pages/RequesterActivityHistoryPage";
import RequesterCreateRequestPage from "../features/requester/pages/RequesterCreateRequestPage";
import RequesterRequestsPage from "../features/requester/pages/RequesterRequestsPage";
import LoginPage from "../features/auth/pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import { paths } from "./paths";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";

const roleDefaultPaths = {
  admin: paths.adminUsers,
  requester: paths.requesterRequests,
  approver: paths.approverPending,
} as const;

function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.root} element={<Navigate to={paths.dashboard} replace />} />
      <Route path={paths.login} element={<LoginPage />} />
      <Route path={paths.unauthorized} element={<div>Unauthorized</div>} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
          <Route element={<RoleGuard allowedRoles={[appRoles.admin]} />}>
            <Route
              path={paths.admin}
              element={<Navigate to={roleDefaultPaths.admin} replace />}
            />
            <Route path={paths.adminUsers} element={<AdminUsersPage />} />
            <Route path={paths.adminRoles} element={<AdminRolesPage />} />
            <Route path={paths.adminDocumentTypes} element={<AdminDocumentTypesPage />} />
            <Route path={paths.adminApprovalRoutes} element={<AdminApprovalRoutesPage />} />
            <Route path={paths.adminActivityLogs} element={<AdminActivityLogsPage />} />
            <Route path={`${paths.admin}/*`} element={<div>Not Found</div>} />
          </Route>
          <Route element={<RoleGuard allowedRoles={[appRoles.requester]} />}>
            <Route
              path={paths.requester}
              element={<Navigate to={roleDefaultPaths.requester} replace />}
            />
            <Route path={paths.requesterRequests} element={<RequesterRequestsPage />} />
            <Route path={paths.requesterCreateRequest} element={<RequesterCreateRequestPage />} />
            <Route
              path={paths.requesterActivityHistory}
              element={<RequesterActivityHistoryPage />}
            />
            <Route path={`${paths.requester}/*`} element={<div>Not Found</div>} />
          </Route>
          <Route element={<RoleGuard allowedRoles={[appRoles.approver]} />}>
            <Route
              path={paths.approver}
              element={<Navigate to={roleDefaultPaths.approver} replace />}
            />
            <Route path={paths.approverPending} element={<ApproverPendingPage />} />
            <Route path={paths.approverReviewed} element={<ApproverReviewedPage />} />
            <Route path={`${paths.approver}/*`} element={<div>Not Found</div>} />
          </Route>
        </Route>
      </Route>
      <Route path={paths.notFound} element={<div>Not Found</div>} />
    </Routes>
  );
}

export default AppRoutes;
