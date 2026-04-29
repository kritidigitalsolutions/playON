import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Users, Swords, Film, UserRound, Radio, Loader2, Tv, Shield } from "lucide-react";
import api from "../api/axios";

const CATEGORY_CONFIG = [
  {
    key: "users",
    label: "Users",
    icon: Users,
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    route: "/users",
    getLabel: (item) => item.name || item.email || "User",
    getSub: (item) => item.email || item.phone || "",
  },
  {
    key: "players",
    label: "Players",
    icon: UserRound,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    route: "/players",
    getLabel: (item) => item.name || "Player",
    getSub: (item) => [item.team, item.sport].filter(Boolean).join(" · "),
  },
  {
    key: "teams",
    label: "Teams",
    icon: Shield,
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    route: "/teams",
    getLabel: (item) => item.name || "Team",
    getSub: (item) => [item.sport, item.country].filter(Boolean).join(" · "),
  },
  {
    key: "series",
    label: "Series",
    icon: Film,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    route: "/series",
    getLabel: (item) => item.title || "Series",
    getSub: (item) => [item.sport, item.status].filter(Boolean).join(" · "),
  },
  {
    key: "matches",
    label: "Matches",
    icon: Swords,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    route: "/matches",
    getLabel: (item) => `${item.teamA || ""} vs ${item.teamB || ""}`,
    getSub: (item) => [item.sport, item.status].filter(Boolean).join(" · "),
  },
  {
    key: "streams",
    label: "Streams",
    icon: Radio,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    route: "/streams",
    getLabel: (item) => item.title || item.streamUrl || "Stream",
    getSub: (item) => [item.streamType, item.status].filter(Boolean).join(" · "),
  },
  {
    key: "channels",
    label: "Live TV",
    icon: Tv,
    color: "text-sky-500",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    route: "/livetv",
    getLabel: (item) => item.name || item.title || "Channel",
    getSub: (item) => [item.category, item.status].filter(Boolean).join(" · "),
  },
];

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function GlobalSearch({ className = "", placeholder = "Search everything... (Ctrl+K)" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const fetchResults = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const searches = [
      api.get("/admin/users", { params: { search: q, limit: 4 } }).catch(() => null),
      api.get("/admin/players", { params: { search: q, limit: 4 } }).catch(() => null),
      api.get("/admin/series", { params: { search: q, limit: 4 } }).catch(() => null),
      api.get("/admin/matches", { params: { search: q, limit: 4 } }).catch(() => null),
      api.get("/admin/streams", { params: { search: q, limit: 4 } }).catch(() => null),
      api.get("/admin/channels", { params: { search: q, limit: 4 } }).catch(() => null),
      api.get("/admin/teams", { params: { search: q, limit: 4 } }).catch(() => null),
    ];

    const [usersRes, playersRes, seriesRes, matchesRes, streamsRes, channelsRes, teamsRes] = await Promise.all(searches);

    setResults({
      users: usersRes?.data?.users || [],
      players: playersRes?.data?.players || [],
      series: seriesRes?.data?.series || [],
      matches: matchesRes?.data?.matches || [],
      streams: streamsRes?.data?.streams || [],
      channels: channelsRes?.data?.channels || [],
      teams: teamsRes?.data?.teams || [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  const hasResults = totalResults > 0;
  const showDropdown = open && query.length >= 2;

  const handleSelect = (route) => {
    setOpen(false);
    setQuery("");
    navigate(route);
  };

  const handleClear = () => {
    setQuery("");
    setResults({});
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/90 pl-9 pr-20 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900"
        />
        <div className="absolute right-3 flex items-center gap-1.5">
          {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={14} />
            </button>
          )}
          {!query && (
            <kbd className="hidden rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400 dark:bg-slate-800 sm:inline">
              Ctrl+K
            </kbd>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[200] max-h-[480px] overflow-y-auto rounded-2xl bg-white shadow-2xl pretty-scroll dark:bg-slate-900">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              Searching across all pages...
            </div>
          )}

          {!loading && !hasResults && query.length >= 2 && (
            <div className="py-10 text-center">
              <Search size={28} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500">No results for &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-xs text-slate-400">Try a different keyword</p>
            </div>
          )}

          {!loading && hasResults && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Summary */}
              <div className="px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
                </p>
              </div>

              {CATEGORY_CONFIG.map((cat) => {
                const items = results[cat.key] || [];
                if (!items.length) return null;
                const Icon = cat.icon;

                return (
                  <div key={cat.key}>
                    {/* Category Header */}
                    <div className={`flex items-center justify-between px-4 py-2 ${cat.bg}`}>
                      <div className="flex items-center gap-2">
                        <Icon size={13} className={cat.color} />
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${cat.color}`}>
                          {cat.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelect(cat.route)}
                        className="text-[10px] text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400"
                      >
                        View all →
                      </button>
                    </div>

                    {/* Items */}
                    {items.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => handleSelect(cat.route)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cat.bg}`}>
                          <Icon size={14} className={cat.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {cat.getLabel(item)}
                          </p>
                          {cat.getSub(item) && (
                            <p className="truncate text-xs text-slate-400">{cat.getSub(item)}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
