import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Players from "./pages/Players";
import Matches from "./pages/Matches";
import Sports from "./pages/Sports";
import Streams from "./pages/Streams";
import LiveTV from "./pages/LiveTV";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const hasAuthToken = () => Boolean(localStorage.getItem("playon_admin_token"));

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function PublicRoute({ children }) {
  if (hasAuthToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="players" element={<Players />} />
        <Route path="matches" element={<Matches />} />
        <Route path="sports" element={<Sports />} />
        <Route path="streams" element={<Streams />} />
        <Route path="livetv" element={<LiveTV />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={hasAuthToken() ? <NotFound /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
