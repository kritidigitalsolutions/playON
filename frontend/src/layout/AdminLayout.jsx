import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import useTheme from "../hooks/useTheme";
import { LOGIN_ROUTE } from "../utils/appPaths";
import { clearAdminSession } from "../utils/auth";
import { PAGE_TITLES } from "../utils/constants";
import { buildBreadcrumbs } from "../utils/helpers";

function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const title = PAGE_TITLES[location.pathname] || "Admin";
  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname]);

  const handleLogout = () => {
    clearAdminSession();
    navigate(LOGIN_ROUTE);
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-violet-100 p-3 transition dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 sm:p-5">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onLogout={handleLogout}
      />

      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[102px]" : "lg:ml-[272px]"}`}>
        <Topbar
          title={title}
          breadcrumbs={breadcrumbs}
          isDark={isDark}
          onThemeToggle={toggleTheme}
          onMenuClick={() => setIsMobileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="pb-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
