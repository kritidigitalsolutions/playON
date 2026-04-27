import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Pencil, Plus, RefreshCw, Star, Trash2, Film, X, Calendar, MapPin, Trophy, Users, Clock, Info } from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import { STATUS_STYLES } from "../utils/constants";
import { getBadgeClass } from "../utils/helpers";

const defaultForm = {
  _id: "",
  title: "",
  sport: "cricket",
  description: "",
  teamA: "",
  teamB: "",
  tourCountry: "",
  teamAPlayers: [],
  teamBPlayers: [],
  startDate: "",
  endDate: "",
  status: "upcoming",
  isFeatured: false,
  imageFile: null,
  matchIds: []
};

function Series() {
  const [seriesList, setSeriesList] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [tempPlayerA, setTempPlayerA] = useState("");
  const [tempPlayerB, setTempPlayerB] = useState("");
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [tempMatch, setTempMatch] = useState("");

  const loadSeries = async () => {
    try {
      setLoading(true);
      setError("");
      const [seriesRes, playersRes, matchesRes] = await Promise.all([
        api.get("/admin/series", { params: { page: 1, limit: 200 } }),
        api.get("/admin/players", { params: { limit: 1000 } }).catch(() => ({ data: { players: [] } })),
        api.get("/admin/matches", { params: { limit: 1000 } }).catch(() => ({ data: { matches: [] } }))
      ]);
      const items = Array.isArray(seriesRes?.data?.series) ? seriesRes.data.series : [];
      setSeriesList(items);
      setPlayers(Array.isArray(playersRes?.data?.players) ? playersRes.data.players : []);
      setAllMatches(Array.isArray(matchesRes?.data?.matches) ? matchesRes.data.matches : []);
    } catch (apiError) {
      setSeriesList([]);
      setError(apiError?.response?.data?.message || "Unable to load series.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const stats = useMemo(() => {
    const upcoming = seriesList.filter((item) => item.status === "upcoming").length;
    const live = seriesList.filter((item) => item.status === "live").length;
    const completed = seriesList.filter((item) => item.status === "completed").length;
    const featured = seriesList.filter((item) => item.isFeatured).length;
    return {
      total: seriesList.length,
      upcoming,
      live,
      completed,
      featured
    };
  }, [seriesList]);

  const filteredSeries = useMemo(() => {
    const q = search.trim().toLowerCase();

    return seriesList.filter((item) => {
      const statusOk = statusFilter === "all" ? true : (item.status || "").toLowerCase() === statusFilter;
      const sportOk = sportFilter === "all" ? true : (item.sport || "").toLowerCase() === sportFilter;
      const text = [item.title, item.slug, item.sport, item.status, item.teamA, item.teamB, item.tourCountry]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const searchOk = !q || text.includes(q);
      return statusOk && sportOk && searchOk;
    });
  }, [seriesList, search, statusFilter, sportFilter]);

  const sports = useMemo(() => {
    const fixed = ["cricket", "football", "basketball", "tennis", "kabaddi", "volleyball", "other"];
    const dynamic = seriesList.map((item) => (item.sport || "").toLowerCase()).filter(Boolean);
    return Array.from(new Set([...fixed, ...dynamic]));
  }, [seriesList]);

  const teamAPlayersList = useMemo(() => {
    if (!form.teamA.trim()) return players;
    return players.filter((p) => (p.team || "").toLowerCase() === form.teamA.toLowerCase());
  }, [players, form.teamA]);

  const teamBPlayersList = useMemo(() => {
    if (!form.teamB.trim()) return players;
    return players.filter((p) => (p.team || "").toLowerCase() === form.teamB.toLowerCase());
  }, [players, form.teamB]);

  const onFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const onMultiSelectChange = (key, options) => {
    const values = Array.from(options).filter(o => o.selected).map(o => o.value);
    setForm((prev) => ({ ...prev, [key]: values }));
  };

  const addPlayer = (teamKey, playerId) => {
    if (!playerId) return;
    setForm(prev => {
      // Use string comparison to avoid type mismatches
      if (prev[teamKey].some(id => String(id) === String(playerId))) return prev;
      return { ...prev, [teamKey]: [...prev[teamKey], playerId] };
    });
  };

  const removePlayer = (teamKey, playerId) => {
    setForm(prev => ({
      ...prev,
      [teamKey]: prev[teamKey].filter(id => id !== playerId)
    }));
  };

  const getPlayerObj = (id) => players.find(p => String(p._id) === String(id));
  const getMatchObj = (id) => allMatches.find(m => String(m._id) === String(id));

  const addMatch = (matchId) => {
    if (!matchId) return;
    setForm(prev => {
      if (prev.matchIds.some(id => String(id) === String(matchId))) return prev;
      return { ...prev, matchIds: [...prev.matchIds, matchId] };
    });
  };

  const removeMatch = (matchId) => {
    setForm(prev => ({
      ...prev,
      matchIds: prev.matchIds.filter(id => String(id) !== String(matchId))
    }));
  };

  const openCreate = () => {
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
    setTempPlayerA("");
    setTempPlayerB("");
    setModalOpen(true);
  };

  const openEdit = (series) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: series?._id || "",
      title: series?.title || "",
      sport: series?.sport || "cricket",
      description: series?.description || "",
      teamA: series?.teamA || "",
      teamB: series?.teamB || "",
      tourCountry: series?.tourCountry || "",
      teamAPlayers: series?.teamAPlayers?.map(p => typeof p === "object" ? p._id : p) || [],
      teamBPlayers: series?.teamBPlayers?.map(p => typeof p === "object" ? p._id : p) || [],
      startDate: series?.startDate ? new Date(series.startDate).toISOString().split('T')[0] : "",
      endDate: series?.endDate ? new Date(series.endDate).toISOString().split('T')[0] : "",
      status: series?.status || "upcoming",
      isFeatured: Boolean(series?.isFeatured),
      imageFile: null,
      matchIds: series?.matchIds || []
    });
    setTempPlayerA("");
    setTempPlayerB("");
    setTempMatch("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.title?.trim()) nextErrors.title = "Series title is required";
    if (!form.sport?.trim()) nextErrors.sport = "Sport is required";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveSeries = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = new FormData();
      payload.append("title", form.title || "");
      payload.append("sport", form.sport || "");
      payload.append("description", form.description || "");
      payload.append("teamA", form.teamA || "");
      payload.append("teamB", form.teamB || "");
      payload.append("tourCountry", form.tourCountry || "");
      form.teamAPlayers.forEach(id => payload.append("teamAPlayers", id));
      form.teamBPlayers.forEach(id => payload.append("teamBPlayers", id));
      form.matchIds.forEach(id => payload.append("matchIds", id));
      if (form.startDate) payload.append("startDate", form.startDate);
      if (form.endDate) payload.append("endDate", form.endDate);
      payload.append("status", form.status || "upcoming");
      payload.append("isFeatured", String(Boolean(form.isFeatured)));
      if (form.imageFile) payload.append("banner", form.imageFile);

      let response;
      if (editMode && form._id) {
        response = await api.patch(`/admin/series/${form._id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        response = await api.post("/admin/series", payload, { headers: { "Content-Type": "multipart/form-data" } });
      }

      const saved = response?.data?.series;
      if (saved?._id) {
        setSeriesList((prev) => {
          if (editMode) {
            return prev.map((item) => (item._id === saved._id ? saved : item));
          }
          return [saved, ...prev];
        });
      } else {
        await loadSeries();
      }

      closeModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save series.");
    } finally {
      setSubmitting(false);
    }
  };

  const openView = async (series) => {
    if (!series?._id) {
      setSelectedSeries(series || null);
      setSelectedMatches([]);
      return;
    }

    try {
      const response = await api.get(`/admin/series/${series._id}`);
      setSelectedSeries(response?.data?.series || series);
      setSelectedMatches(response?.data?.matches || []);
    } catch {
      setSelectedSeries(series);
      setSelectedMatches([]);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleting(true);
      setError("");
      await api.delete(`/admin/series/${deleteTarget._id}`);
      setSeriesList((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete series.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Series"
        subtitle="Manage sports series, tournaments, and leagues."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSeries}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={15} /> Add Series
            </button>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-rose-500">{error}</p> : null}

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr)]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, sport..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Status: All</option>
          <option value="upcoming">Status: Upcoming</option>
          <option value="live">Status: Live</option>
          <option value="completed">Status: Completed</option>
          <option value="archived">Status: Archived</option>
        </select>
        <select
          value={sportFilter}
          onChange={(event) => setSportFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Sport: All</option>
          {sports.map((item) => (
            <option key={item} value={item}>
              Sport: {item.charAt(0).toUpperCase() + item.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Live</p>
          <p className="mt-2 text-2xl font-semibold text-rose-500">{stats.live}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Upcoming</p>
          <p className="mt-2 text-2xl font-semibold text-blue-500">{stats.upcoming}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-500">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Featured</p>
          <p className="mt-2 text-2xl font-semibold text-amber-500">{stats.featured}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Loading series...
          </div>
        ) : null}

        {!loading && !filteredSeries.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            No series found for this filter.
          </div>
        ) : null}

        {filteredSeries.map((series, index) => (
          <motion.div
            key={series._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                  {series.banner ? (
                    <img src={series.banner} alt={series.title || "Series"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <Film size={18} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{series.title || "Untitled Series"}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {(series.sport || "other").toUpperCase()} {series.teamA && series.teamB ? `• ${series.teamA} vs ${series.teamB}` : ""}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs ${getBadgeClass(series.status, STATUS_STYLES)}`}>
                {series.status || "upcoming"}
              </span>
            </div>

            <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{series.description || "No description added yet."}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {series.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-600 dark:bg-amber-500/10">
                  <Star size={12} className="fill-current" /> Featured
                </span>
              )}
              <button
                type="button"
                onClick={() => openView(series)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                onClick={() => openEdit(series)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(series)}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-300 px-3 py-2 text-sm text-rose-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modalOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Series" : "Create Series"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update series details, dates, and banner.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveSeries} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Series Title</span>
                    <input
                      value={form.title}
                      onChange={(e) => onFormChange("title", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    {formErrors.title ? <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport</span>
                    <select
                      value={form.sport}
                      onChange={(e) => onFormChange("sport", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {sports.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    {formErrors.sport ? <span className="mt-1 block text-xs text-rose-500">{formErrors.sport}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team A</span>
                    <input
                      value={form.teamA}
                      onChange={(e) => onFormChange("teamA", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team B</span>
                    <input
                      value={form.teamB}
                      onChange={(e) => onFormChange("teamB", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Tour Country</span>
                    <input
                      value={form.tourCountry}
                      onChange={(e) => onFormChange("tourCountry", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Start Date</span>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => onFormChange("startDate", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">End Date</span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => onFormChange("endDate", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Status</span>
                    <select
                      value={form.status}
                      onChange={(e) => onFormChange("status", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="upcoming">upcoming</option>
                      <option value="live">live</option>
                      <option value="completed">completed</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => onFormChange("isFeatured", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                    />
                    <span className="text-slate-700 dark:text-slate-200">Is Featured</span>
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Banner Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onFormChange("imageFile", e.target.files?.[0] || null)}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team A Players</span>
                    <div className="flex gap-2">
                      <select
                        value={tempPlayerA}
                        onChange={(e) => setTempPlayerA(e.target.value)}
                        className="h-11 flex-1 rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">Select Player</option>
                        {teamAPlayersList.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.team || p.sport})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          addPlayer("teamAPlayers", tempPlayerA);
                          setTempPlayerA("");
                        }}
                        className="flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.teamAPlayers.map((id) => {
                        const p = getPlayerObj(id);
                        return (
                          <div key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
                            <span className="text-slate-700 dark:text-slate-200">{p?.name || "Player"}</span>
                            <button type="button" onClick={() => removePlayer("teamAPlayers", id)} className="text-rose-500 hover:text-rose-600">
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team B Players</span>
                    <div className="flex gap-2">
                      <select
                        value={tempPlayerB}
                        onChange={(e) => setTempPlayerB(e.target.value)}
                        className="h-11 flex-1 rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">Select Player</option>
                        {teamBPlayersList.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.team || p.sport})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          addPlayer("teamBPlayers", tempPlayerB);
                          setTempPlayerB("");
                        }}
                        className="flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.teamBPlayers.map((id) => {
                        const p = getPlayerObj(id);
                        return (
                          <div key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
                            <span className="text-slate-700 dark:text-slate-200">{p?.name || "Player"}</span>
                            <button type="button" onClick={() => removePlayer("teamBPlayers", id)} className="text-rose-500 hover:text-rose-600">
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Link Matches</span>
                    <div className="flex gap-2">
                      <select
                        value={tempMatch}
                        onChange={(e) => setTempMatch(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">Select Match</option>
                        {allMatches.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.teamA} vs {m.teamB} ({new Date(m.matchDate).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          addMatch(tempMatch);
                          setTempMatch("");
                        }}
                        className="flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.matchIds.map((id) => {
                        const m = getMatchObj(id);
                        return (
                          <div key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
                            <span className="text-slate-700 dark:text-slate-200">{m ? `${m.teamA} vs ${m.teamB}` : "Match"}</span>
                            <button type="button" onClick={() => removeMatch(id)} className="text-rose-500 hover:text-rose-600">
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
                    <textarea
                      rows="3"
                      value={form.description}
                      onChange={(e) => onFormChange("description", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Series"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSeries ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
            >
              <div className="flex h-full flex-col">
                {/* Header/Banner Area */}
                <div className="relative h-64 w-full shrink-0">
                  {selectedSeries.banner ? (
                    <img 
                      src={selectedSeries.banner} 
                      alt={selectedSeries.title} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800">
                      <Film size={48} className="text-slate-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                  
                  <button 
                    type="button" 
                    onClick={() => setSelectedSeries(null)} 
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition hover:bg-black/40"
                  >
                    <X size={20} />
                  </button>

                  <div className="absolute bottom-6 left-8 right-8">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getBadgeClass(selectedSeries.status, STATUS_STYLES)}`}>
                            {selectedSeries.status || "upcoming"}
                          </span>
                          {selectedSeries.isFeatured && (
                            <span className="flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              <Star size={10} className="fill-current" /> Featured
                            </span>
                          )}
                        </div>
                        <h2 className="mt-2 text-3xl font-bold text-white">{selectedSeries.title || "Untitled Series"}</h2>
                        <p className="mt-1 flex items-center gap-2 text-slate-300">
                          <Trophy size={14} className="text-indigo-400" />
                          <span className="text-sm font-medium">{(selectedSeries.sport || "Other").toUpperCase()}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-600" />
                          <span className="text-sm text-slate-400">{selectedSeries.tourCountry || "Global"}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="grid overflow-hidden lg:grid-cols-[1fr,400px]">
                  {/* Left Column: Details & Players */}
                  <div className="overflow-y-auto p-8 max-h-[calc(90vh-256px)] pretty-scroll">
                    <div className="space-y-8">
                      {/* Dates & Info Grid */}
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Timeline</p>
                            <p className="mt-1 text-sm text-slate-200">
                              {selectedSeries.startDate ? new Date(selectedSeries.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "TBA"}
                              <span className="mx-2 text-slate-600">—</span>
                              {selectedSeries.endDate ? new Date(selectedSeries.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "TBA"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Venue / Country</p>
                            <p className="mt-1 text-sm text-slate-200">{selectedSeries.tourCountry || "To be announced"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <Info size={16} className="text-slate-400" />
                          <h4 className="text-sm font-semibold text-slate-200">About the Series</h4>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-400">
                          {selectedSeries.description || "No detailed description available for this series."}
                        </p>
                      </div>

                      {/* Players Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-slate-400" />
                          <h4 className="text-sm font-semibold text-slate-200">Participating Squads</h4>
                        </div>
                        
                        <div className="grid gap-6 sm:grid-cols-2">
                          {/* Team A */}
                          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">{selectedSeries.teamA || "Team A"}</span>
                              <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-400">
                                {selectedSeries.teamAPlayers?.length || 0} Players
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedSeries.teamAPlayers?.length > 0 ? (
                                selectedSeries.teamAPlayers.map((p) => (
                                  <span key={p._id} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300">
                                    {p.name}
                                  </span>
                                ))
                              ) : (
                                <p className="text-xs italic text-slate-600">No players listed</p>
                              )}
                            </div>
                          </div>

                          {/* Team B */}
                          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-widest text-rose-400">{selectedSeries.teamB || "Team B"}</span>
                              <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-400">
                                {selectedSeries.teamBPlayers?.length || 0} Players
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedSeries.teamBPlayers?.length > 0 ? (
                                selectedSeries.teamBPlayers.map((p) => (
                                  <span key={p._id} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300">
                                    {p.name}
                                  </span>
                                ))
                              ) : (
                                <p className="text-xs italic text-slate-600">No players listed</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Matches List */}
                  <div className="border-l border-white/5 bg-slate-950/30 p-8 overflow-y-auto max-h-[calc(90vh-256px)] pretty-scroll">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-indigo-400" />
                        <h4 className="text-base font-semibold text-white">Schedule</h4>
                      </div>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
                        {selectedMatches.length} Matches
                      </span>
                    </div>

                    <div className="space-y-4">
                      {selectedMatches.length > 0 ? (
                        selectedMatches.map((match) => (
                          <div key={match._id} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:bg-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getBadgeClass(match.status, STATUS_STYLES)}`}>
                                {match.status}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(match.matchDate).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 text-right">
                                <p className="text-xs font-bold text-slate-200 line-clamp-1">{match.teamA}</p>
                              </div>
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-500">
                                VS
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-xs font-bold text-slate-200 line-clamp-1">{match.teamB}</p>
                              </div>
                            </div>

                            {match.score && (
                              <div className="mt-3 text-center">
                                <span className="rounded-lg bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
                                  {match.score}
                                </span>
                              </div>
                            )}

                            <div className="mt-2 text-center">
                              <p className="text-[10px] text-slate-500 line-clamp-1 italic">{match.title}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-600">
                            <Trophy size={24} />
                          </div>
                          <p className="text-sm font-medium text-slate-400">No matches found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this series?"
        message={`This will permanently remove ${deleteTarget?.title || "this series"}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Series"}
      />
    </div>
  );
}

export default Series;
