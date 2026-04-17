export const NAV_LINKS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Users", path: "/users" },
  { label: "Players", path: "/players" },
  { label: "Matches", path: "/matches" },
  { label: "Sports", path: "/sports" },
  { label: "Streams", path: "/streams" },
  { label: "Live TV", path: "/livetv" },
  { label: "Notifications", path: "/notifications" },
  { label: "Reports", path: "/reports" },
  { label: "Settings", path: "/settings" }
];

export const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/players": "Players",
  "/matches": "Matches",
  "/sports": "Sports",
  "/streams": "Streams",
  "/livetv": "Live TV",
  "/notifications": "Notifications",
  "/reports": "Reports",
  "/settings": "Settings"
};

export const STATUS_STYLES = {
  active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  pending: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  inactive: "bg-slate-500/15 text-slate-400 border border-slate-500/20",
  live: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
  maintenance: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  completed: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
  upcoming: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  scheduled: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  ended: "bg-slate-500/15 text-slate-400 border border-slate-500/20",
  offline: "bg-slate-500/15 text-slate-400 border border-slate-500/20",
  failed: "bg-amber-500/15 text-amber-400 border border-amber-500/20"
};

export const ITEMS_PER_PAGE = 7;
