import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Players from "./pages/Players";
import Teams from "./pages/Teams";
import Series from "./pages/Series";
import Plans from "./pages/Plans";
import Matches from "./pages/Matches";
import Sports from "./pages/Sports";
import Banners from "./pages/Banners";
import Podcasts from "./pages/Podcasts";
import UserPlans from "./pages/UserPlans";
import StarPlayers from "./pages/StarPlayers";
import MatchHighlights from "./pages/MatchHighlights";
import LiveTV from "./pages/LiveTV";
import ActivateTV from "./pages/ActivateTV";
import Notifications from "./pages/Notifications";
import Promo from "./pages/Promo";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SubAdmins from "./pages/SubAdmins";
import Legal from "./pages/Legal";
import SocialMedia from "./pages/SocialMedia";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { getValidAdminToken } from "./utils/auth";
import {
  DASHBOARD_ROUTE,
  FORGOT_PASSWORD_ROUTE,
  LOGIN_ROUTE,
  RESET_PASSWORD_ROUTE
} from "./utils/appPaths";

const hasAuthToken = () => Boolean(getValidAdminToken());

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasAuthToken()) {
    return <Navigate to={LOGIN_ROUTE} replace state={{ from: location }} />;
  }

  return children;
}

function PublicRoute({ children }) {
  if (hasAuthToken()) {
    return <Navigate to={DASHBOARD_ROUTE} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route
        path={LOGIN_ROUTE}
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path={FORGOT_PASSWORD_ROUTE}
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path={RESET_PASSWORD_ROUTE}
        element={
          <PublicRoute>
            <ResetPassword />
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
        <Route index element={<Navigate to={DASHBOARD_ROUTE} replace />} />
        <Route path={DASHBOARD_ROUTE.slice(1)} element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="players" element={<Players />} />
        <Route path="teams" element={<Teams />} />
        <Route path="series" element={<Series />} />
        <Route path="plans" element={<Plans />} />
        <Route path="user-plans" element={<UserPlans />} />
        <Route path="matches" element={<Matches />} />
        <Route path="sports" element={<Sports />} />
        <Route path="banners" element={<Banners />} />
        <Route path="podcasts" element={<Podcasts />} />
        <Route path="star-players" element={<StarPlayers />} />
        <Route path="match-highlights" element={<MatchHighlights />} />
        <Route path="livetv" element={<LiveTV />} />
        <Route path="activate-tv" element={<ActivateTV />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="promo" element={<Promo />} />
        <Route path="reports" element={<Reports />} />
        <Route path="legal" element={<Legal />} />
        <Route path="sub-admins" element={<SubAdmins />} />
        <Route path="social-media" element={<SocialMedia />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={hasAuthToken() ? <NotFound /> : <Navigate to={LOGIN_ROUTE} replace />} />
    </Routes>
  );
}

export default App;
