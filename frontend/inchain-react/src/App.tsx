import { Navigate, Route, Routes } from "react-router";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}

export default App;
