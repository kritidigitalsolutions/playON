import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Settings, User, X, Shield, Mail, Activity } from "lucide-react";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import { getAdminProfile } from "../utils/auth";
import { getInitials } from "../utils/helpers";
import { SETTINGS_ROUTE } from "../utils/appPaths";

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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    const loadProfile = () => {
      setAdminProfile(getAdminProfile());
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
    <>
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
                    setShowProfileModal(true);
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
                    navigate(SETTINGS_ROUTE);
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

    {/* Beautiful Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-sm transform overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl transition-all dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
            >
              <X size={20} />
            </button>

            <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-4xl font-bold text-white shadow-xl ring-4 ring-indigo-50 dark:ring-slate-900">
              {getInitials(adminName)}
            </div>

            <h3 className="mb-1 focus:outline-none text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {adminName}
            </h3>

            <div className="mb-8 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Shield size={14} />
              {adminRole.charAt(0).toUpperCase() + adminRole.slice(1)}
            </div>

            <div className="space-y-4 rounded-2xl bg-slate-50/80 p-5 text-left dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                  <User size={20} className="text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</p>
                  <p className="truncate text-[15px] font-medium text-slate-800 dark:text-slate-200">{adminName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                  <Mail size={20} className="text-rose-500 dark:text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</p>
                  <p className="truncate text-[15px] font-medium text-slate-800 dark:text-slate-200">{adminEmail || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                  <Activity size={20} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Account Status</p>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                    <p className="truncate text-[15px] font-medium text-slate-800 dark:text-slate-200">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Topbar;
