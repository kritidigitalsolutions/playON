import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import { getInitials } from "../utils/helpers";

function Topbar({
  title,
  breadcrumbs,
  search,
  onSearch,
  isDark,
  onThemeToggle,
  onMenuClick,
  notifications,
  onLogout
}) {
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    const loadProfile = () => {
      try {
        const raw = localStorage.getItem("playon_admin_profile");
        setAdminProfile(raw ? JSON.parse(raw) : null);
      } catch {
        setAdminProfile(null);
      }
    };

    loadProfile();
    window.addEventListener("storage", loadProfile);
    return () => window.removeEventListener("storage", loadProfile);
  }, []);

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setOpenProfileMenu(false);
      }
    };

    if (openProfileMenu) {
      document.addEventListener("mousedown", onOutsideClick);
    }

    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [openProfileMenu]);

  const adminName = useMemo(() => adminProfile?.name || "PlayON Admin", [adminProfile]);
  const adminEmail = useMemo(() => adminProfile?.email || "", [adminProfile]);
  const adminRole = useMemo(() => adminProfile?.role || "Admin", [adminProfile]);

  return (
    <header className="sticky top-0 z-30 mb-6 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.path} className="flex items-center gap-1">
                <Link to={crumb.path} className="hover:text-indigo-500">
                  {crumb.label}
                </Link>
                {index < breadcrumbs.length - 1 ? <span>/</span> : null}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
            >
              <Menu size={16} />
            </button>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          </div>
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <SearchBar value={search} onChange={onSearch} placeholder="Search users, matches, streams..." className="w-full sm:w-72" />
          <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
          <NotificationBell items={notifications} />
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpenProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 p-1 pr-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
                {getInitials(adminName)}
              </div>
              <div className="hidden text-left sm:block">
                <p className="max-w-[130px] truncate text-xs font-medium text-slate-700 dark:text-slate-200">{adminName}</p>
                <p className="max-w-[130px] truncate text-[10px] text-slate-500 dark:text-slate-400">{adminRole}</p>
              </div>
              <ChevronDown size={14} className="text-slate-500 dark:text-slate-300" />
            </button>

            {openProfileMenu ? (
              <div className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-1 rounded-lg px-3 py-2">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{adminName}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{adminEmail || adminRole}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpenProfileMenu(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <User size={14} />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenProfileMenu(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Settings size={14} />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenProfileMenu(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
