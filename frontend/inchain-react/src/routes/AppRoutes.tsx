import { Navigate, Route, Routes } from "react-router";
import DashboardPage from "../pages/DashboardPage";
import { paths } from "./paths";

function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.root} element={<Navigate to={paths.dashboard} replace />} />
      <Route path={paths.dashboard} element={<DashboardPage />} />
      <Route path={paths.login} element={<div>Login</div>} />
      <Route path={paths.admin} element={<div>Admin</div>} />
      <Route path={paths.requester} element={<div>Requester</div>} />
      <Route path={paths.approver} element={<div>Approver</div>} />
      <Route path={paths.unauthorized} element={<div>Unauthorized</div>} />
      <Route path={paths.notFound} element={<div>Not Found</div>} />
    </Routes>
  );
}

export default AppRoutes;
