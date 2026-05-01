import { motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  LayoutDashboard,
  Layers3,
  Radio,
  Tv,
  Settings,
  Shield,
  ShieldCheck,
  Star,
  Swords,
  TicketPercent,
  LogOut,
  Trophy,
  UserRound,
  Users,
  Wallet,
  ScrollText,
  Film,
  Image as ImageIcon,
  Link as LinkIcon,
  Mic
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { getAdminProfile } from "../utils/auth";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
   { label: "Sub Admins", path: "/sub-admins", icon: ShieldCheck, superOnly: true },
  { label: "Users", path: "/users", icon: Users },

  { label: "Players", path: "/players", icon: UserRound },
  { label: "Teams", path: "/teams", icon: Shield },
  { label: "Tours & Series", path: "/series", icon: Film },
  { label: "Subscribed Users", path: "/user-plans", icon: Wallet },
  { label: "Subscription Plans", path: "/plans", icon: Layers3 },
  { label: "Matches", path: "/matches", icon: Swords },
  { label: "Sports", path: "/sports", icon: Trophy },
  { label: "Banners", path: "/banners", icon: ImageIcon },
  { label: "Star Players", path: "/star-players", icon: Star },
  { label: "Podcasts", path: "/podcasts", icon: Mic },
  { label: "Streams", path: "/streams", icon: Radio },
  { label: "Live TV", path: "/livetv", icon: Tv },
  { label: "Activate TV", path: "/activate-tv", icon: Tv },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Coupon Codes", path: "/promo", icon: TicketPercent },
  { label: "Legal", path: "/legal", icon: ScrollText },
  { label: "Social Media", path: "/social-media", icon: LinkIcon },
  { label: "Settings", path: "/settings", icon: Settings }
];

function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile, onLogout }) {
  const adminRole = getAdminProfile()?.role;
  const visibleNavItems = navItems.filter((item) => !item.superOnly || adminRole === "super_admin");
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-indigo-200/30
    bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-slate-100 backdrop-blur
    transition-all duration-300 ${isCollapsed ? "w-[90px]" : "w-[260px]"}
  `;

  return (
    <>
      <motion.aside initial={false} animate={{ x: 0 }} className={`${sidebarClasses} hidden lg:flex`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <ShieldCheck className="text-indigo-300" size={22} />
            {!isCollapsed && <span className="text-lg font-semibold">PlayON Admin</span>}
          </div>
          <button type="button" onClick={onToggleCollapse} className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="mt-3 flex-1 space-y-2 px-3 overflow-y-auto pretty-scroll">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/40 to-violet-500/30 text-white"
                      : "text-slate-300 hover:bg-white/10"
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="m-3 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CircleUserRound size={16} />
            {!isCollapsed && "Platform health stable"}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-rose-200 transition hover:bg-rose-500/20"
          >
            <LogOut size={14} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isMobileOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-indigo-200/30 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-slate-100 lg:hidden"
      >
        <div className="flex items-center justify-between p-4">
          <span className="text-lg font-semibold">PlayON Admin</span>
          <button type="button" onClick={onCloseMobile} className="rounded-lg bg-white/10 px-2 py-1 text-sm">
            Close
          </button>
        </div>
        <nav className="flex-1 space-y-2 px-3 overflow-y-auto pretty-scroll">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    isActive ? "bg-indigo-500/40 text-white" : "text-slate-200 hover:bg-white/10"
                  }`
                }
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto p-3">
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onLogout();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </motion.aside>
    </>
  );
}

export default Sidebar;
