
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Trophy,
  Upload,
  X
} from "lucide-react";
import api from "../api/axios";
import useDebounce from "../hooks/useDebounce";
import PageHeader from "../components/PageHeader";

const PAGE_SIZE = 8;

const FALLBACK_MATCHES = [
  {
    _id: "m1",
    title: "India vs Australia",
    sport: "cricket",
    teamA: "India",
    teamB: "Australia",
    teamALogo: "",
    teamBLogo: "",
    tournament: "World Cup",
    venue: "Mumbai",
    matchDate: "2026-04-20T12:00:00.000Z",
    status: "upcoming",
    thumbnail: "",
    banner: "",
    streamUrl: "https://test.com/live",
    streamType: "HLS",
    score: "0/0",
    description: "High-intensity group stage clash.",
    isFeatured: true,
    createdAt: "2026-04-15T07:52:00.000Z",
    updatedAt: "2026-04-15T08:09:00.000Z"
  },
  {
    _id: "m2",
    title: "Barcelona vs Juventus",
    sport: "football",
    teamA: "Barcelona",
    teamB: "Juventus",
    teamALogo: "",
    teamBLogo: "",
    tournament: "Champions League",
    venue: "Barcelona",
    matchDate: "2026-04-16T16:00:00.000Z",
    status: "live",
    thumbnail: "",
    banner: "",
    streamUrl: "https://test.com/live2",
    streamType: "DASH",
    score: "2 - 1",
    description: "Knockout stage quarterfinal.",
    isFeatured: false,
    createdAt: "2026-04-14T10:00:00.000Z",
    updatedAt: "2026-04-15T11:15:00.000Z"
  }
];

const statusTheme = {
  live: "border border-rose-500/30 bg-rose-500/15 text-rose-300",
  upcoming: "border border-blue-500/30 bg-blue-500/15 text-blue-300",
  completed: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  cancelled: "border border-slate-500/30 bg-slate-500/15 text-slate-300"
};

const defaultForm = {
  title: "",
  sport: "cricket",
  teamA: "",
  teamB: "",
  teamALogo: "",
  teamBLogo: "",
  tournament: "",
  venue: "",
  matchDate: "",
  status: "upcoming",
  streamUrl: "",
  streamType: "",
  score: "",
  description: "",
  isFeatured: false,
  thumbnailFile: null,
  bannerFile: null,
  thumbnailPreview: "",
  bannerPreview: ""
};

const classNames = (...parts) => parts.filter(Boolean).join(" ");

const asDateTimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function Toasts({ toasts, onRemove }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={classNames(
              "pointer-events-auto rounded-xl border px-4 py-2 text-sm shadow-lg backdrop-blur",
              toast.type === "success" && "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
              toast.type === "error" && "border-rose-400/30 bg-rose-500/15 text-rose-200",
              toast.type === "info" && "border-indigo-400/30 bg-indigo-500/15 text-indigo-200"
            )}
          >
            <div className="flex items-center gap-2">
              <span>{toast.message}</span>
              <button type="button" onClick={() => onRemove(toast.id)} className="text-xs opacity-80 hover:opacity-100">
                Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({ status: "all", sport: "all", sort: "newest" });
  const [toasts, setToasts] = useState([]);

  const debouncedSearch = useDebounce(search, 350);

  const pushToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800);
  };

  const closeFormModal = () => {
    setModalOpen(false);
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
  };

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/matches");
      const apiMatches = Array.isArray(response?.data?.matches) ? response.data.matches : [];
      setMatches(apiMatches);
    } catch {
      setMatches(FALLBACK_MATCHES);
      pushToast("Could not load from API. Showing fallback data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const stats = useMemo(() => {
    const live = matches.filter((m) => m.status === "live").length;
    const upcoming = matches.filter((m) => m.status === "upcoming").length;
    const completed = matches.filter((m) => m.status === "completed").length;
    return { total: matches.length, live, upcoming, completed };
  }, [matches]);

  const sportOptions = useMemo(() => {
    const fixed = ["cricket", "football", "basketball", "kabaddi", "tennis", "volleyball", "other"];
    const dynamic = Array.from(new Set(matches.map((m) => (m.sport || "").toLowerCase()).filter(Boolean)));
    return Array.from(new Set([...fixed, ...dynamic]));
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    const list = matches.filter((m) => {
      const statusOk = filters.status === "all" ? true : (m.status || "").toLowerCase() === filters.status;
      const sportOk = filters.sport === "all" ? true : (m.sport || "").toLowerCase() === filters.sport;
      const searchOk = !q || [m.title, m.teamA, m.teamB, m.tournament, m.venue, m.sport, m.status].filter(Boolean).join(" ").toLowerCase().includes(q);
      return statusOk && sportOk && searchOk;
    });

    if (filters.sort === "oldest") {
      list.sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));
    } else if (filters.sort === "az") {
      list.sort((a, b) => (a.title || `${a.teamA} vs ${a.teamB}`).localeCompare(b.title || `${b.teamA} vs ${b.teamB}`));
    } else {
      list.sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate));
    }

    return list;
  }, [matches, filters, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.sport, filters.sort]);

  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / PAGE_SIZE));
  const pageData = useMemo(() => filteredMatches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredMatches, page]);

  const openCreate = () => {
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (match) => {
    setEditMode(true);
    setFormErrors({});
    setForm({ ...defaultForm, ...match, matchDate: asDateTimeLocal(match.matchDate), thumbnailPreview: match.thumbnail || "", bannerPreview: match.banner || "", thumbnailFile: null, bannerFile: null });
    setModalOpen(true);
  };

  const openView = async (match) => {
    try {
      const response = await api.get(`/admin/matches/${match._id}`);
      setSelectedMatch(response?.data?.match || match);
    } catch {
      setSelectedMatch(match);
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.title?.trim()) nextErrors.title = "Title is required";
    if (!form.teamA?.trim()) nextErrors.teamA = "Team A is required";
    if (!form.teamB?.trim()) nextErrors.teamB = "Team B is required";
    if (!form.matchDate) nextErrors.matchDate = "Date & time is required";
    if (!form.sport) nextErrors.sport = "Sport is required";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const onFileChange = (field, previewField, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, [field]: file, [previewField]: preview }));
  };

  const saveMatch = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("sport", form.sport);
      payload.append("teamA", form.teamA);
      payload.append("teamB", form.teamB);
      payload.append("teamALogo", form.teamALogo || "");
      payload.append("teamBLogo", form.teamBLogo || "");
      payload.append("tournament", form.tournament || "");
      payload.append("venue", form.venue || "");
      payload.append("matchDate", new Date(form.matchDate).toISOString());
      payload.append("status", form.status);
      payload.append("streamUrl", form.streamUrl || "");
      payload.append("streamType", form.streamType || "");
      payload.append("score", form.score || "");
      payload.append("description", form.description || "");
      payload.append("isFeatured", String(Boolean(form.isFeatured)));
      if (form.thumbnailFile) payload.append("thumbnail", form.thumbnailFile);
      if (form.bannerFile) payload.append("banner", form.bannerFile);

      let response;
      if (editMode && form._id) {
        response = await api.put(`/admin/matches/${form._id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
        const updated = response?.data?.match;
        if (updated) setMatches((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
        pushToast("Match updated successfully", "success");
      } else {
        try {
          response = await api.post("/admin/matches", payload, { headers: { "Content-Type": "multipart/form-data" } });
        } catch {
          response = await api.post("/admin/matches/create", payload, { headers: { "Content-Type": "multipart/form-data" } });
        }
        const created = response?.data?.match;
        if (created) setMatches((prev) => [created, ...prev]);
        pushToast("Match created successfully", "success");
      }

      closeFormModal();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Unable to save match", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await api.delete(`/admin/matches/${deleteTarget._id}`);
      setMatches((prev) => prev.filter((m) => m._id !== deleteTarget._id));
      pushToast("Match deleted", "success");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const updateStatus = async (match, nextStatus) => {
    try {
      if (nextStatus === "live") {
        try { await api.patch(`/admin/matches/${match._id}/live`); }
        catch { await api.patch(`/admin/matches/${match._id}/status`, { status: "live" }); }
      } else {
        try { await api.patch(`/admin/matches/${match._id}/end`); }
        catch { await api.patch(`/admin/matches/${match._id}/status`, { status: "completed" }); }
      }
      setMatches((prev) => prev.map((m) => (m._id === match._id ? { ...m, status: nextStatus } : m)));
      pushToast(`Match marked ${nextStatus}`, "success");
    } catch {
      pushToast("Status update failed", "error");
    }
  };

  const toggleFeatured = async (match) => {
    const previous = match.isFeatured;
    setMatches((prev) => prev.map((m) => (m._id === match._id ? { ...m, isFeatured: !m.isFeatured } : m)));
    try {
      await api.patch(`/admin/matches/${match._id}/feature`);
      pushToast(`Featured ${previous ? "removed" : "enabled"}`, "success");
    } catch {
      setMatches((prev) => prev.map((m) => (m._id === match._id ? { ...m, isFeatured: previous } : m)));
      pushToast("Feature toggle failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      <Toasts toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))} />

      <PageHeader
        title="Matches"
        subtitle="Track every fixture, control stream state, and update match cards from one place."
        action={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={loadMatches}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={15} /> Add Match
            </button>
          </div>
        }
      />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Matches", value: stats.total, icon: Trophy, tone: "text-slate-700 dark:text-slate-200" },
          { label: "Live Now", value: stats.live, icon: Activity, tone: "text-rose-600 dark:text-rose-300" },
          { label: "Upcoming", value: stats.upcoming, icon: CalendarClock, tone: "text-blue-600 dark:text-blue-300" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, tone: "text-emerald-600 dark:text-emerald-300" }
        ].map((chip) => {
          const Icon = chip.icon;
          return (
            <div key={chip.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{chip.label}</p>
                <Icon size={16} className={chip.tone} />
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{chip.value}</p>
            </div>
          );
        })}
      </motion.section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr),repeat(3,minmax(0,1fr)),auto]">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, teams, tournament, venue..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="all">Status: All</option>
            <option value="live">Status: Live</option>
            <option value="upcoming">Status: Upcoming</option>
            <option value="completed">Status: Completed</option>
            <option value="cancelled">Status: Cancelled</option>
          </select>

          <select
            value={filters.sport}
            onChange={(e) => setFilters((prev) => ({ ...prev, sport: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="all">Sport: All</option>
            {sportOptions.map((sport) => (
              <option key={sport} value={sport}>
                Sport: {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="az">Sort: A-Z</option>
          </select>

          <button
            type="button"
            onClick={() => setFilters({ status: "all", sport: "all", sort: "newest" })}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Match Directory</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{filteredMatches.length} total after filters</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : pageData.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Match</th>
                  <th className="px-4 py-3">Date & Venue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Stream</th>
                  <th className="px-4 py-3 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {pageData.map((match) => (
                  <tr key={match._id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {match.thumbnail ? (
                            <img src={match.thumbnail} alt={match.title} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{match.title || `${match.teamA} vs ${match.teamB}`}</p>
                            {match.isFeatured ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-300">
                                <Star size={11} className="fill-current" /> Featured
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {match.teamA} vs {match.teamB} • {(match.sport || "other").toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      <p>{formatDate(match.matchDate)}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{match.venue || "Venue TBD"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={classNames("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize", statusTheme[match.status] || statusTheme.upcoming)}>
                        {match.status || "upcoming"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      <p>{match.streamType || "No stream type"}</p>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{match.streamUrl || "No stream URL"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => openView(match)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white">
                          <Eye size={15} />
                        </button>
                        <button type="button" onClick={() => openEdit(match)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white">
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => toggleFeatured(match)} className={classNames("inline-flex h-9 w-9 items-center justify-center rounded-lg border transition", match.isFeatured ? "border-amber-400/40 text-amber-500" : "border-slate-200 text-slate-500 hover:border-amber-400/40 hover:text-amber-500 dark:border-slate-700")}>
                          <Star size={15} className={match.isFeatured ? "fill-current" : ""} />
                        </button>
                        <button type="button" onClick={() => updateStatus(match, match.status === "live" ? "completed" : "live")} className="rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300">
                          {match.status === "live" ? "End" : "Go Live"}
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(match)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-300/40 text-rose-500 transition hover:bg-rose-500/10">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No matches found.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting filters or create a new match.</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">Showing {pageData.length} of {filteredMatches.length} matches</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
              <ChevronLeft size={15} />
            </button>
            <span className="min-w-[70px] text-center text-sm text-slate-600 dark:text-slate-300">{page} / {totalPages}</span>
            <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {modalOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Match" : "Create Match"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update the match card, stream details, and publishing state.</p>
                </div>
                <button type="button" onClick={closeFormModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveMatch} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Match Title</span>
                    <input value={form.title} onChange={(e) => onFormChange("title", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.title ? <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport</span>
                    <select value={form.sport} onChange={(e) => onFormChange("sport", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                      {sportOptions.map((sport) => (
                        <option key={sport} value={sport}>
                          {sport.charAt(0).toUpperCase() + sport.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team A</span>
                    <input value={form.teamA} onChange={(e) => onFormChange("teamA", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.teamA ? <span className="mt-1 block text-xs text-rose-500">{formErrors.teamA}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team B</span>
                    <input value={form.teamB} onChange={(e) => onFormChange("teamB", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.teamB ? <span className="mt-1 block text-xs text-rose-500">{formErrors.teamB}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Tournament</span>
                    <input value={form.tournament} onChange={(e) => onFormChange("tournament", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Venue</span>
                    <input value={form.venue} onChange={(e) => onFormChange("venue", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Match Date & Time</span>
                    <input type="datetime-local" value={form.matchDate} onChange={(e) => onFormChange("matchDate", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.matchDate ? <span className="mt-1 block text-xs text-rose-500">{formErrors.matchDate}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Status</span>
                    <select value={form.status} onChange={(e) => onFormChange("status", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream URL</span>
                    <input value={form.streamUrl} onChange={(e) => onFormChange("streamUrl", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream Type</span>
                    <input value={form.streamType} onChange={(e) => onFormChange("streamType", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Score</span>
                    <input value={form.score} onChange={(e) => onFormChange("score", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
                    <textarea rows="3" value={form.description} onChange={(e) => onFormChange("description", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Thumbnail</span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                      <Upload size={15} /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange("thumbnailFile", "thumbnailPreview", e.target.files?.[0])} />
                    </label>
                    {form.thumbnailPreview ? <img src={form.thumbnailPreview} alt="Thumbnail preview" className="mt-3 h-24 w-full rounded-lg object-cover" /> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Banner</span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                      <Upload size={15} /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange("bannerFile", "bannerPreview", e.target.files?.[0])} />
                    </label>
                    {form.bannerPreview ? <img src={form.bannerPreview} alt="Banner preview" className="mt-3 h-24 w-full rounded-lg object-cover" /> : null}
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeFormModal} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Match"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMatch ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedMatch.title || `${selectedMatch.teamA} vs ${selectedMatch.teamB}`}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedMatch.tournament || "Tournament TBD"}</p>
                </div>
                <button type="button" onClick={() => setSelectedMatch(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[2fr,1fr]">
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  {selectedMatch.banner ? (
                    <img src={selectedMatch.banner} alt={`${selectedMatch.title || "Match"} banner`} className="h-44 w-full object-cover md:h-56" />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 md:h-56">
                      <div className="flex items-center gap-2 text-sm">
                        <ImageIcon size={16} /> No banner uploaded
                      </div>
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  {selectedMatch.thumbnail ? (
                    <img src={selectedMatch.thumbnail} alt={`${selectedMatch.title || "Match"} thumbnail`} className="h-44 w-full object-cover md:h-56" />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 md:h-56">
                      <div className="flex items-center gap-2 text-sm">
                        <ImageIcon size={16} /> No thumbnail uploaded
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p><strong>Teams:</strong> {selectedMatch.teamA} vs {selectedMatch.teamB}</p>
                <p><strong>Date:</strong> {formatDate(selectedMatch.matchDate)}</p>
                <p><strong>Venue:</strong> {selectedMatch.venue || "Venue TBD"}</p>
                <p><strong>Stream:</strong> {selectedMatch.streamUrl || "No stream URL"}</p>
                <p><strong>Status:</strong> {selectedMatch.status || "upcoming"}</p>
                <p><strong>Description:</strong> {selectedMatch.description || "No description added."}</p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Delete match?</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                This will remove {deleteTarget.title || `${deleteTarget.teamA} vs ${deleteTarget.teamB}`} from the admin list.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  Cancel
                </button>
                <button type="button" onClick={confirmDelete} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default Matches;
