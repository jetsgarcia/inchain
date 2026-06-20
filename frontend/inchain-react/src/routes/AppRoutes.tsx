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
            <Route path={paths.users} element={<AdminUsersPage />} />
            <Route path={paths.roles} element={<AdminRolesPage />} />
            <Route path={paths.documentTypes} element={<AdminDocumentTypesPage />} />
            <Route path={paths.approvalRoutes} element={<AdminApprovalRoutesPage />} />
            <Route path={paths.systemActivityHistory} element={<AdminActivityLogsPage />} />
            <Route path={`${paths.users}/*`} element={<div>Not Found</div>} />
            <Route path={`${paths.roles}/*`} element={<div>Not Found</div>} />
            <Route path={`${paths.documentTypes}/*`} element={<div>Not Found</div>} />
            <Route path={`${paths.approvalRoutes}/*`} element={<div>Not Found</div>} />
            <Route path={`${paths.systemActivityHistory}/*`} element={<div>Not Found</div>} />
          </Route>
          <Route element={<RoleGuard allowedRoles={[appRoles.requester]} />}>
            <Route path={paths.requests} element={<RequesterRequestsPage />} />
            <Route path={paths.createRequest} element={<RequesterCreateRequestPage />} />
            <Route path={paths.activityHistory} element={<RequesterActivityHistoryPage />} />
            <Route path={`${paths.requests}/*`} element={<div>Not Found</div>} />
            <Route path={`${paths.activityHistory}/*`} element={<div>Not Found</div>} />
          </Route>
          <Route element={<RoleGuard allowedRoles={[appRoles.approver]} />}>
            <Route path={paths.pendingRequests} element={<ApproverPendingPage />} />
            <Route path={paths.reviewedRequests} element={<ApproverReviewedPage />} />
            <Route path={`${paths.pendingRequests}/*`} element={<div>Not Found</div>} />
            <Route path={`${paths.reviewedRequests}/*`} element={<div>Not Found</div>} />
          </Route>
        </Route>
      </Route>
      <Route path={paths.notFound} element={<div>Not Found</div>} />
    </Routes>
  );
}

export default AppRoutes;
