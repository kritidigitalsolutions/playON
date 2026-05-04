
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Play,
  Trash2,
  Trophy,
  Upload,
  X
} from "lucide-react";
import api from "../api/axios";
import useDebounce from "../hooks/useDebounce";
import PageHeader from "../components/PageHeader";
import WatchModal from "../components/WatchModal";

const PAGE_SIZE = 8;
const DEFAULT_SPORT_SLUGS = ["cricket", "football", "basketball", "kabaddi", "tennis", "volleyball", "other"];

const FALLBACK_MATCHES = [
  {
    _id: "m1",
    title: "India vs Australia",
    sport: "cricket",
    teamA: "India",
    teamB: "Australia",
    teamALogo: "",
    teamBLogo: "",
    venue: "Mumbai",
    matchDate: "2026-04-20T12:00:00.000Z",
    status: "upcoming",
    thumbnail: "",
    banner: "",
    scoreSources: [
      {
        provider: "Mock Provider",
        category: "manual",
        url: "",
        apiKey: "",
        priority: 1,
        isActive: true,
        notes: "Fallback sample score source"
      }
    ],
    seriesId: null,
    description: "High-intensity group stage clash.",
    isFeatured: true,
    isTrending: true,
    liveStartedAt: null,
    liveEndedAt: null,
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
    venue: "Barcelona",
    matchDate: "2026-04-16T16:00:00.000Z",
    status: "live",
    thumbnail: "",
    banner: "",
    scoreSources: [],
    seriesId: null,
    description: "Knockout stage quarterfinal.",
    isFeatured: false,
    isTrending: false,
    liveStartedAt: "2026-04-16T16:00:00.000Z",
    liveEndedAt: null,
    createdAt: "2026-04-14T10:00:00.000Z",
    updatedAt: "2026-04-15T11:15:00.000Z"
  }
];

const statusTheme = {
  live: "border border-rose-200 bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  upcoming: "border border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
  completed: "border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300"
};

const scoreSourceCategories = [
  "official_api",
  "third_party_api",
  "rapidapi",
  "manual",
  "web_scrape",
  "rss_feed",
  "json_feed",
  "xml_feed",
  "iframe",
  "webview",
  "socket",
  "websocket",
  "firebase",
  "supabase",
  "google_sheet",
  "cms",
  "admin_panel",
  "cron_job",
  "static_url",
  "backup",
  "ai_parser",
  "custom_provider",
  "other"
];

const emptyScoreSource = {
  provider: "",
  category: "third_party_api",
  url: "",
  apiKey: "",
  priority: "1",
  isActive: true,
  notes: ""
};

const defaultForm = {
  title: "",
  sport: "cricket",
  teamA: "",
  teamB: "",
  teamALogo: "",
  teamBLogo: "",
  venue: "",
  matchDate: "",
  status: "upcoming",
  seriesId: "",
  scoreSources: [],
  description: "",
  isFeatured: false,
  isTrending: false,
  isPremium: false,
  streamTitle: "",
  streamProvider: "",
  streamUrl: "",
  streamBackupUrl: "",
  streamType: "hls",
  streamQuality: "auto",
  thumbnailFile: null,
  bannerFile: null,
  teamALogoFile: null,
  teamBLogoFile: null,
  thumbnailPreview: "",
  bannerPreview: "",
  teamALogoPreview: "",
  teamBLogoPreview: ""
};

const classNames = (...parts) => parts.filter(Boolean).join(" ");

const normalizeSportSlug = (value) => String(value || "").trim().toLowerCase();

const formatSportLabel = (value) => {
  const text = String(value || "").replace(/[-_]+/g, " ").trim();
  if (!text) return "Other";
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

const getSeriesId = (seriesValue) => {
  if (!seriesValue) return "";
  if (typeof seriesValue === "object") return seriesValue._id || "";
  return seriesValue;
};

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

const getCreatedSortTime = (item = {}) => {
  const value = item.createdAt || item.updatedAt || item.matchDate;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const normalizeScoreSource = (source = {}) => ({
  ...emptyScoreSource,
  ...source,
  priority: String(source.priority ?? emptyScoreSource.priority),
  isActive: source.isActive !== false
});

const hasScoreSourceValue = (source) =>
  Boolean(
    source?.provider?.trim() ||
      source?.url?.trim() ||
      source?.apiKey?.trim() ||
      source?.notes?.trim()
  );

const getStreamFormValues = (match = {}) => {
  const stream = match.stream || {};

  return {
    streamTitle: stream.title || match.title || `${match.teamA || ""} vs ${match.teamB || ""}`.trim(),
    streamProvider: stream.provider || "",
    streamUrl: stream.streamUrl || "",
    streamBackupUrl: stream.backupUrl || "",
    streamType: stream.streamType || "hls",
    streamQuality: stream.quality || "auto"
  };
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
              toast.type === "success" && "border-emerald-400/30 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
              toast.type === "error" && "border-rose-400/30 bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
              toast.type === "info" && "border-indigo-400/30 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200"
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

function ImageUploadField({ label, preview, onChange, previewAlt, previewClassName = "object-cover" }) {
  return (
    <div className="block text-sm">
      <span className="mb-1 block text-slate-500 dark:text-slate-400">{label}</span>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:border-slate-300 dark:hover:border-slate-600">
        <Upload size={15} /> Upload
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0])} />
      </label>
      {preview ? (
        <img
          src={preview}
          alt={previewAlt}
          className={classNames("mt-3 h-24 w-full rounded-lg bg-slate-50 dark:bg-slate-950", previewClassName)}
        />
      ) : null}
    </div>
  );
}

function DetailItem({ label, value, className }) {
  const displayValue = value === true ? "Yes" : value === false ? "No" : value === null || value === undefined || value === "" ? "-" : value;

  return (
    <div className={classNames("rounded-xl border border-slate-200 bg-slate-50 p-3 dark:bg-slate-950/60", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-800 dark:text-slate-100">{displayValue}</p>
    </div>
  );
}

function MediaPreview({ label, src, alt, fit = "object-cover" }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      {src ? (
        <img src={src} alt={alt} className={classNames("h-36 w-full bg-slate-50 dark:bg-slate-950", fit)} />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800">
          <div className="flex items-center gap-2 text-sm">
            <ImageIcon size={16} /> Not uploaded
          </div>
        </div>
      )}
    </div>
  );
}

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [watchData, setWatchData] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({ status: "all", sport: "all", spotlight: "all", sort: "newest" });
  const [toasts, setToasts] = useState([]);
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [sportsCatalog, setSportsCatalog] = useState([]);
  const [sportsLoaded, setSportsLoaded] = useState(false);
  const [sportsLoadFailed, setSportsLoadFailed] = useState(false);

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
      const response = await api.get("/admin/matches", { params: { limit: "all" } });
      const apiMatches = Array.isArray(response?.data?.matches) ? response.data.matches : [];
      setMatches(apiMatches);
    } catch {
      setMatches(FALLBACK_MATCHES);
      pushToast("Could not load from API. Showing fallback data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadSeriesOptions = async () => {
    try {
      const response = await api.get("/admin/series", { params: { page: 1, limit: 200 } });
      setSeriesOptions(Array.isArray(response?.data?.series) ? response.data.series : []);
    } catch {
      setSeriesOptions([]);
    }
  };

  const loadSports = async () => {
    try {
      const response = await api.get("/admin/sports");
      setSportsCatalog(Array.isArray(response?.data?.sports) ? response.data.sports : []);
      setSportsLoaded(true);
      setSportsLoadFailed(false);
    } catch {
      setSportsCatalog([]);
      setSportsLoaded(true);
      setSportsLoadFailed(true);
      pushToast("Could not load sports. Showing fallback options.", "error");
    }
  };

  useEffect(() => {
    loadMatches();
    loadSeriesOptions();
    loadSports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const stats = useMemo(() => {
    const live = matches.filter((m) => m.status === "live").length;
    const upcoming = matches.filter((m) => m.status === "upcoming").length;
    const completed = matches.filter((m) => m.status === "completed").length;
    const trending = matches.filter((m) => m.isTrending).length;
    return { total: matches.length, live, upcoming, completed, trending };
  }, [matches]);

  const sportOptions = useMemo(() => {
    const bySlug = new Map();

    if (!sportsLoaded || sportsLoadFailed) {
      DEFAULT_SPORT_SLUGS.forEach((slug) => {
        bySlug.set(slug, { value: slug, label: formatSportLabel(slug) });
      });
    }

    sportsCatalog.forEach((sport) => {
      const slug = normalizeSportSlug(sport.slug || sport.name);
      if (!slug) return;
      bySlug.set(slug, {
        value: slug,
        label: sport.name || formatSportLabel(slug)
      });
    });

    matches.forEach((match) => {
      const slug = normalizeSportSlug(match.sport);
      if (slug && !bySlug.has(slug)) {
        bySlug.set(slug, { value: slug, label: formatSportLabel(slug) });
      }
    });

    return Array.from(bySlug.values());
  }, [matches, sportsCatalog, sportsLoaded, sportsLoadFailed]);

  const getSeriesLabel = useCallback((seriesValue) => {
    const seriesId = getSeriesId(seriesValue);
    if (seriesValue && typeof seriesValue === "object") return seriesValue.title || seriesValue.name || seriesId;
    const match = seriesOptions.find((item) => item._id === seriesId);
    return match?.title || seriesId || "-";
  }, [seriesOptions]);

  const filteredMatches = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    const list = matches.filter((m) => {
      const statusOk = filters.status === "all" ? true : (m.status || "").toLowerCase() === filters.status;
      const sportOk = filters.sport === "all" ? true : (m.sport || "").toLowerCase() === filters.sport;
      const spotlightOk =
        filters.spotlight === "all" ||
        (filters.spotlight === "featured" && m.isFeatured) ||
        (filters.spotlight === "trending" && m.isTrending);
      const searchOk = !q || [m.title, m.teamA, m.teamB, getSeriesLabel(m.seriesId), m.venue, m.sport, m.status].filter(Boolean).join(" ").toLowerCase().includes(q);
      return statusOk && sportOk && spotlightOk && searchOk;
    });

    if (filters.sort === "oldest") {
      list.sort((a, b) => getCreatedSortTime(a) - getCreatedSortTime(b));
    } else if (filters.sort === "az") {
      list.sort((a, b) => (a.title || `${a.teamA} vs ${a.teamB}`).localeCompare(b.title || `${b.teamA} vs ${b.teamB}`));
    } else {
      list.sort((a, b) => getCreatedSortTime(b) - getCreatedSortTime(a));
    }

    return list;
  }, [matches, filters, debouncedSearch, getSeriesLabel]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.sport, filters.spotlight, filters.sort]);

  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / PAGE_SIZE));
  const pageData = useMemo(() => filteredMatches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredMatches, page]);

  const openCreate = () => {
    setEditMode(false);
    setForm({ ...defaultForm, sport: sportOptions[0]?.value || "" });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (match) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      ...defaultForm,
      ...match,
      matchDate: asDateTimeLocal(match.matchDate),
      seriesId: getSeriesId(match.seriesId),
      scoreSources: Array.isArray(match.scoreSources) ? match.scoreSources.map(normalizeScoreSource) : [],
      ...getStreamFormValues(match),
      isFeatured: Boolean(match.isFeatured),
      isTrending: Boolean(match.isTrending),
      isPremium: Boolean(match.isPremium),
      thumbnailPreview: match.thumbnail || "",
      bannerPreview: match.banner || "",
      teamALogoPreview: match.teamALogo || "",
      teamBLogoPreview: match.teamBLogo || "",
      thumbnailFile: null,
      bannerFile: null,
      teamALogoFile: null,
      teamBLogoFile: null
    });
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

  // const handleWatch = async (match) => {
  //   try {
  //     const response = await api.get(`/admin/matches/${match._id}/watch`);
  //     if (response?.data?.success) {
  //       setWatchData({
  //         title: response.data.match?.title || `${response.data.match?.teamA} vs ${response.data.match?.teamB}`,
  //         streamUrl: response.data.stream?.streamUrl,
  //         streamType: response.data.stream?.streamType
  //       });
  //     }
  //   } catch (error) {
  //     pushToast(error?.response?.data?.message || "Stream not available", "error");
  //   }
  // };
const handleWatch = async (match) => {
  if (match.status !== "live") {
    pushToast("Match is not live yet", "error");
    return;
  }

  try {
    const response = await api.get(`/admin/matches/${match._id}/watch`);

    if (response?.data?.success) {
      setWatchData({
        title:
          response.data.match?.title ||
          `${response.data.match?.teamA} vs ${response.data.match?.teamB}`,
        streamUrl: response.data.stream?.streamUrl,
        streamType: response.data.stream?.streamType
      });
    }
  } catch (error) {
    pushToast(
      error?.response?.data?.message || "Stream not available",
      "error"
    );
  }
};
  const validate = () => {
    const nextErrors = {};
    if (!form.title?.trim()) nextErrors.title = "Title is required";
    if (!form.teamA?.trim()) nextErrors.teamA = "Team A is required";
    if (!form.teamB?.trim()) nextErrors.teamB = "Team B is required";
    if (!form.matchDate) nextErrors.matchDate = "Date & time is required";
    if (!form.sport) nextErrors.sport = "Sport is required";
    if (!form.seriesId) nextErrors.seriesId = "Linked series is required";
    if (form.status === "live" && !form.streamUrl?.trim()) nextErrors.streamUrl = "Stream URL is required for live matches";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const onSeriesChange = (seriesId) => {
    const selectedSeries = seriesOptions.find((series) => String(series._id) === String(seriesId));
    setForm((prev) => ({
      ...prev,
      seriesId,
      sport: selectedSeries?.sport || prev.sport
    }));
    if (formErrors.seriesId) setFormErrors((prev) => ({ ...prev, seriesId: "" }));
  };

  const onFileChange = (field, previewField, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, [field]: file, [previewField]: preview }));
  };

  const onScoreSourceChange = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      scoreSources: prev.scoreSources.map((source, sourceIndex) =>
        sourceIndex === index ? { ...source, [key]: value } : source
      )
    }));
  };

  const addScoreSource = () => {
    setForm((prev) => ({
      ...prev,
      scoreSources: [...prev.scoreSources, { ...emptyScoreSource }]
    }));
  };

  const removeScoreSource = (index) => {
    setForm((prev) => ({
      ...prev,
      scoreSources: prev.scoreSources.filter((_, sourceIndex) => sourceIndex !== index)
    }));
  };

  const appendStreamFields = (payload) => {
    payload.append("streamTitle", form.streamTitle || form.title || "");
    payload.append("streamProvider", form.streamProvider || "");
    payload.append("streamUrl", form.streamUrl || "");
    payload.append("streamBackupUrl", form.streamBackupUrl || "");
    payload.append("streamType", form.streamType || "hls");
    payload.append("streamQuality", form.streamQuality || "auto");
    payload.append("streamIsPremium", String(Boolean(form.isPremium)));
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
      if (!form.teamALogoFile) payload.append("teamALogo", form.teamALogo || "");
      if (!form.teamBLogoFile) payload.append("teamBLogo", form.teamBLogo || "");
      payload.append("seriesId", form.seriesId || "");
      payload.append("venue", form.venue || "");
      payload.append("matchDate", new Date(form.matchDate).toISOString());
      payload.append("status", form.status);
      payload.append("description", form.description || "");
      payload.append("isFeatured", String(Boolean(form.isFeatured)));
      payload.append("isTrending", String(Boolean(form.isTrending)));
      payload.append("isPremium", String(Boolean(form.isPremium)));
      appendStreamFields(payload);
      if (form.thumbnailFile) payload.append("thumbnail", form.thumbnailFile);
      if (form.bannerFile) payload.append("banner", form.bannerFile);
      if (form.teamALogoFile) payload.append("teamALogo", form.teamALogoFile);
      if (form.teamBLogoFile) payload.append("teamBLogo", form.teamBLogoFile);
      const scoreSources = form.scoreSources
        .filter(hasScoreSourceValue)
        .map((source) => ({
          provider: source.provider || "",
          category: source.category || "third_party_api",
          url: source.url || "",
          apiKey: source.apiKey || "",
          priority: Number(source.priority) || 1,
          isActive: source.isActive !== false,
          notes: source.notes || ""
        }));
      payload.append("scoreSources", JSON.stringify(scoreSources));

      let response;
      if (editMode && form._id) {
        response = await api.patch(`/admin/matches/${form._id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
        const updated = response?.data?.match;
        if (updated) setMatches((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
        pushToast("Match updated successfully", "success");
      } else {
        response = await api.post("/admin/matches/create", payload, { headers: { "Content-Type": "multipart/form-data" } });
        const created = response?.data?.match;
        if (created) {
          setMatches((prev) => [created, ...prev.filter((match) => match._id !== created._id)]);
          setFilters({ status: "all", sport: "all", spotlight: "all", sort: "newest" });
          setPage(1);
        }
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
      const stream = match.stream || {};
      if (nextStatus === "live") {
        if (!stream.streamUrl) {
          pushToast("Add a stream URL before going live", "error");
          openEdit(match);
          return;
        }

        const response = await api.patch(`/admin/matches/${match._id}/live`, {
          streamTitle: stream.title || match.title || `${match.teamA} vs ${match.teamB}`,
          streamProvider: stream.provider || "",
          streamUrl: stream.streamUrl,
          streamBackupUrl: stream.backupUrl || "",
          streamType: stream.streamType || "hls",
          streamQuality: stream.quality || "auto",
          streamIsPremium: Boolean(match.isPremium)
        });
        const updated = response?.data?.match;
        if (updated) setMatches((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      } else {
        const response = await api.patch(`/admin/matches/${match._id}/end`);
        const updated = response?.data?.match;
        if (updated) setMatches((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      }
      pushToast(`Match marked ${nextStatus}`, "success");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Status update failed", "error");
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
              onClick={() => {
                loadMatches();
                loadSports();
              }}
              className="admin-toolbar-btn"
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

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Matches", value: stats.total, icon: Trophy, tone: "text-slate-700 dark:text-slate-200" },
          { label: "Live Now", value: stats.live, icon: Activity, tone: "text-rose-600 dark:text-rose-300" },
          { label: "Upcoming", value: stats.upcoming, icon: CalendarClock, tone: "text-blue-600 dark:text-blue-300" },
          { label: "Trending", value: stats.trending, icon: Flame, tone: "text-orange-600 dark:text-orange-300" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, tone: "text-emerald-600 dark:text-emerald-300" }
        ].map((chip) => {
          const Icon = chip.icon;
          return (
            <div key={chip.label} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{chip.label}</p>
                <Icon size={16} className={chip.tone} />
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{chip.value}</p>
            </div>
          );
        })}
      </motion.section>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr),repeat(4,minmax(0,1fr)),auto]">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, teams, series, venue..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-950 dark:text-slate-100"
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
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="all">Sport: All</option>
            {sportOptions.map((sport) => (
              <option key={sport.value} value={sport.value}>
                Sport: {sport.label}
              </option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="az">Sort: A-Z</option>
          </select>

          <select
            value={filters.spotlight}
            onChange={(e) => setFilters((prev) => ({ ...prev, spotlight: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="all">Spotlight: All</option>
            <option value="featured">Spotlight: Featured</option>
            <option value="trending">Spotlight: Trending</option>
          </select>

          <button
            type="button"
            onClick={() => setFilters({ status: "all", sport: "all", spotlight: "all", sort: "newest" })}
            className="admin-toolbar-btn"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white shadow-sm dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
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
                           {match.isFeatured && (
  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600">
    <Star size={11} className="fill-current" /> Featured
  </span>
)}

{match.isTrending && (
  <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-500/10 px-2 py-0.5 text-[11px] text-orange-600 dark:text-orange-300">
    <Flame size={11} className="fill-current" /> Trending
  </span>
)}
{match.isPremium && (
  <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-600 dark:text-violet-300">
    👑 Premium
  </span>
)}
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
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
  type="button"
  onClick={() => handleWatch(match)}
  disabled={match.status !== "live"}
  className={`admin-action-btn-square
    ${
      match.status === "live"
        ? ""
        : "cursor-not-allowed opacity-50"
    }`}
>
  <Play size={15} />
</button>
                        <button type="button" onClick={() => openView(match)} className="admin-action-btn-square">
                          <Eye size={15} />
                        </button>
                        <button type="button" onClick={() => openEdit(match)} className="admin-action-btn-square">
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => toggleFeatured(match)} className={classNames("admin-action-btn-square", match.isFeatured ? "bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25" : "")}>
                          <Star size={15} className={match.isFeatured ? "fill-current" : ""} />
                        </button>
                        <button type="button" onClick={() => updateStatus(match, match.status === "live" ? "completed" : "live")} className="admin-action-btn-sm">
                          {match.status === "live" ? "End" : "Go Live"}
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(match)} className="admin-action-btn-danger-square">
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

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Showing {pageData.length} of {filteredMatches.length} matches</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="admin-action-btn-square">
              <ChevronLeft size={15} />
            </button>
            <span className="min-w-[70px] text-center text-sm text-slate-600 dark:text-slate-300">{page} / {totalPages}</span>
            <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages} className="admin-action-btn-square">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {modalOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
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
                    <input value={form.title} onChange={(e) => onFormChange("title", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.title ? <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport</span>
                    <select value={form.sport} onChange={(e) => onFormChange("sport", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                      <option value="" disabled>Select sport</option>
                      {sportOptions.map((sport) => (
                        <option key={sport.value} value={sport.value}>
                          {sport.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.sport ? <span className="mt-1 block text-xs text-rose-500">{formErrors.sport}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team A</span>
                    <input value={form.teamA} onChange={(e) => onFormChange("teamA", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.teamA ? <span className="mt-1 block text-xs text-rose-500">{formErrors.teamA}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team B</span>
                    <input value={form.teamB} onChange={(e) => onFormChange("teamB", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.teamB ? <span className="mt-1 block text-xs text-rose-500">{formErrors.teamB}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Linked Series</span>
                    <select value={form.seriesId} onChange={(e) => onSeriesChange(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                      <option value="" disabled>Select series</option>
                      {seriesOptions.map((series) => (
                        <option key={series._id} value={series._id}>
                          {series.title || "Untitled Series"}
                        </option>
                      ))}
                    </select>
                    {formErrors.seriesId ? <span className="mt-1 block text-xs text-rose-500">{formErrors.seriesId}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Venue</span>
                    <input value={form.venue} onChange={(e) => onFormChange("venue", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Match Date & Time</span>
                    <input type="datetime-local" value={form.matchDate} onChange={(e) => onFormChange("matchDate", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.matchDate ? <span className="mt-1 block text-xs text-rose-500">{formErrors.matchDate}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Status</span>
                    <select value={form.status} onChange={(e) => onFormChange("status", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>

                  <div className="md:col-span-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Stream</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Playback settings are saved to the Stream module for this match.</p>
                      </div>
                      <span className={classNames("rounded-full px-2.5 py-1 text-xs", form.streamUrl ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>
                        {form.streamUrl ? "Configured" : "Not configured"}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-sm">
                        <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream Title</span>
                        <input value={form.streamTitle} onChange={(e) => onFormChange("streamTitle", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                      </label>

                      <label className="block text-sm">
                        <span className="mb-1 block text-slate-500 dark:text-slate-400">Provider</span>
                        <input value={form.streamProvider} onChange={(e) => onFormChange("streamProvider", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                      </label>

                      <label className="block text-sm md:col-span-2">
                        <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream URL</span>
                        <input value={form.streamUrl} onChange={(e) => onFormChange("streamUrl", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" placeholder="https://..." />
                        {formErrors.streamUrl ? <span className="mt-1 block text-xs text-rose-500">{formErrors.streamUrl}</span> : null}
                      </label>

                      <label className="block text-sm md:col-span-2">
                        <span className="mb-1 block text-slate-500 dark:text-slate-400">Backup URL</span>
                        <input value={form.streamBackupUrl} onChange={(e) => onFormChange("streamBackupUrl", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" placeholder="https://..." />
                      </label>

                      <label className="block text-sm">
                        <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream Type</span>
                        <select value={form.streamType} onChange={(e) => onFormChange("streamType", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                          <option value="hls">hls</option>
                          <option value="youtube">youtube</option>
                          <option value="iframe">iframe</option>
                          <option value="rtmp">rtmp</option>
                          <option value="srt">srt</option>
                          <option value="other">other</option>
                        </select>
                      </label>

                      <label className="block text-sm">
                        <span className="mb-1 block text-slate-500 dark:text-slate-400">Quality</span>
                        <select value={form.streamQuality} onChange={(e) => onFormChange("streamQuality", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                          <option value="auto">auto</option>
                          <option value="1080p">1080p</option>
                          <option value="720p">720p</option>
                          <option value="480p">480p</option>
                          <option value="360p">360p</option>
                          <option value="240p">240p</option>
                        </select>
                      </label>

                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Score Sources</span>
                      <button type="button" onClick={addScoreSource} className="admin-action-btn-sm">
                        <Plus size={14} /> Add Source
                      </button>
                    </div>

                    {form.scoreSources.length ? (
                      <div className="space-y-3">
                        {form.scoreSources.map((source, index) => (
                          <div key={index} className="rounded-xl p-3">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Source {index + 1}</p>
                              <button type="button" onClick={() => removeScoreSource(index)} className="admin-action-btn-danger-square">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <label className="block text-sm">
                                <span className="mb-1 block text-slate-500 dark:text-slate-400">Provider</span>
                                <input value={source.provider} onChange={(e) => onScoreSourceChange(index, "provider", e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                              </label>

                              <label className="block text-sm">
                                <span className="mb-1 block text-slate-500 dark:text-slate-400">Category</span>
                                <select value={source.category} onChange={(e) => onScoreSourceChange(index, "category", e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                                  {scoreSourceCategories.map((category) => (
                                    <option key={category} value={category}>
                                      {category.replace(/_/g, " ")}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label className="block text-sm md:col-span-2">
                                <span className="mb-1 block text-slate-500 dark:text-slate-400">URL</span>
                                <input value={source.url} onChange={(e) => onScoreSourceChange(index, "url", e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" placeholder="https://..." />
                              </label>

                              <label className="block text-sm">
                                <span className="mb-1 block text-slate-500 dark:text-slate-400">API Key</span>
                                <input value={source.apiKey} onChange={(e) => onScoreSourceChange(index, "apiKey", e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                              </label>

                              <label className="block text-sm">
                                <span className="mb-1 block text-slate-500 dark:text-slate-400">Priority</span>
                                <input type="number" min="1" value={source.priority} onChange={(e) => onScoreSourceChange(index, "priority", e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                              </label>

                              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <input type="checkbox" checked={source.isActive !== false} onChange={(e) => onScoreSourceChange(index, "isActive", e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                                Active source
                              </label>

                              <label className="block text-sm md:col-span-2">
                                <span className="mb-1 block text-slate-500 dark:text-slate-400">Notes</span>
                                <textarea rows="2" value={source.notes} onChange={(e) => onScoreSourceChange(index, "notes", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:text-slate-400">
                        No score source configured.
                      </div>
                    )}
                  </div>

                 <div className="flex gap-6 md:col-span-2">
  <label className="flex items-center gap-2 text-sm text-slate-600">
    <input
      type="checkbox"
      checked={form.isFeatured}
      onChange={(e) => onFormChange("isFeatured", e.target.checked)}
      className="h-4 w-4"
    />
    Featured
  </label>

  <label className="flex items-center gap-2 text-sm text-slate-600">
    <input
      type="checkbox"
      checked={form.isTrending}
      onChange={(e) => onFormChange("isTrending", e.target.checked)}
      className="h-4 w-4"
    />
    Trending
  </label>

  <label className="flex items-center gap-2 text-sm text-violet-600">
    <input
      type="checkbox"
      checked={form.isPremium}
      onChange={(e) => onFormChange("isPremium", e.target.checked)}
      className="h-4 w-4"
    />
    👑 Premium (subscription required)
  </label>
</div>

<label className="block text-sm md:col-span-2">
  <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
  <textarea
    rows="3"
    value={form.description}
    onChange={(e) => onFormChange("description", e.target.value)}
    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
  />
</label>


                  <ImageUploadField
                    label="Team A Logo"
                    preview={form.teamALogoPreview}
                    previewAlt="Team A logo preview"
                    previewClassName="object-contain p-2"
                    onChange={(file) => onFileChange("teamALogoFile", "teamALogoPreview", file)}
                  />

                  <ImageUploadField
                    label="Team B Logo"
                    preview={form.teamBLogoPreview}
                    previewAlt="Team B logo preview"
                    previewClassName="object-contain p-2"
                    onChange={(file) => onFileChange("teamBLogoFile", "teamBLogoPreview", file)}
                  />

                  <ImageUploadField
                    label="Thumbnail"
                    preview={form.thumbnailPreview}
                    previewAlt="Thumbnail preview"
                    onChange={(file) => onFileChange("thumbnailFile", "thumbnailPreview", file)}
                  />

                  <ImageUploadField
                    label="Banner"
                    preview={form.bannerPreview}
                    previewAlt="Banner preview"
                    onChange={(file) => onFileChange("bannerFile", "bannerPreview", file)}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeFormModal} className="admin-secondary-btn">
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
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedMatch.title || `${selectedMatch.teamA} vs ${selectedMatch.teamB}`}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {getSeriesLabel(selectedMatch.seriesId)} - {(selectedMatch.sport || "other").toUpperCase()}
                  </p>
                </div>
                <button type="button" onClick={() => setSelectedMatch(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MediaPreview label="Team A Logo" src={selectedMatch.teamALogo} alt={`${selectedMatch.teamA || "Team A"} logo`} fit="object-contain p-3" />
                <MediaPreview label="Team B Logo" src={selectedMatch.teamBLogo} alt={`${selectedMatch.teamB || "Team B"} logo`} fit="object-contain p-3" />
                <MediaPreview label="Thumbnail" src={selectedMatch.thumbnail} alt={`${selectedMatch.title || "Match"} thumbnail`} />
                <MediaPreview label="Banner" src={selectedMatch.banner} alt={`${selectedMatch.title || "Match"} banner`} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <DetailItem label="Match ID" value={selectedMatch._id} />
                <DetailItem label="Title" value={selectedMatch.title} />
                <DetailItem label="Sport" value={selectedMatch.sport} />
                <DetailItem label="Team A" value={selectedMatch.teamA} />
                <DetailItem label="Team B" value={selectedMatch.teamB} />
                <DetailItem label="Linked Series" value={getSeriesLabel(selectedMatch.seriesId)} />
                <DetailItem label="Venue" value={selectedMatch.venue || "Venue TBD"} />
                <DetailItem label="Date & Time" value={formatDate(selectedMatch.matchDate)} />
                <DetailItem label="Status" value={selectedMatch.status || "upcoming"} />
                <DetailItem label="Featured" value={Boolean(selectedMatch.isFeatured)} />
                <DetailItem label="Trending" value={Boolean(selectedMatch.isTrending)} />
                <DetailItem label="Live Started At" value={formatDate(selectedMatch.liveStartedAt)} />
                <DetailItem label="Live Ended At" value={formatDate(selectedMatch.liveEndedAt)} />
                <DetailItem label="Created At" value={formatDate(selectedMatch.createdAt)} />
                <DetailItem label="Updated At" value={formatDate(selectedMatch.updatedAt)} />
                <DetailItem label="Description" value={selectedMatch.description || "No description added."} className="md:col-span-2 xl:col-span-3" />
              </div>

              <div className="mt-4 rounded-xl p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Stream</h3>
                  <span className={classNames("rounded-full px-2 py-0.5 text-xs", selectedMatch.stream?.streamUrl ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>
                    {selectedMatch.stream?.status || "not configured"}
                  </span>
                </div>
                {selectedMatch.stream ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <DetailItem label="Provider" value={selectedMatch.stream.provider} />
                    <DetailItem label="Type" value={selectedMatch.stream.streamType} />
                    <DetailItem label="Quality" value={selectedMatch.stream.quality} />
                    <DetailItem label="Stream URL" value={selectedMatch.stream.streamUrl} className="md:col-span-2 xl:col-span-3" />
                    <DetailItem label="Backup URL" value={selectedMatch.stream.backupUrl} className="md:col-span-2 xl:col-span-3" />
                    <DetailItem label="Started At" value={formatDate(selectedMatch.stream.startedAt)} />
                    <DetailItem label="Ended At" value={formatDate(selectedMatch.stream.endedAt)} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No stream configured for this match.</p>
                )}
              </div>

              <div className="mt-4 rounded-xl p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Score Sources</h3>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {selectedMatch.scoreSources?.length || 0}
                  </span>
                </div>
                {selectedMatch.scoreSources?.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedMatch.scoreSources.map((source, index) => (
                      <div key={index} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950/60">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{source.provider || `Source ${index + 1}`}</p>
                          <span className={classNames("rounded-full px-2 py-0.5 text-xs", source.isActive !== false ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>
                            {source.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="space-y-1 text-slate-600 dark:text-slate-300">
                          <p><strong>Category:</strong> {source.category || "-"}</p>
                          <p><strong>Priority:</strong> {source.priority ?? "-"}</p>
                          <p className="break-words"><strong>URL:</strong> {source.url || "-"}</p>
                          <p className="break-words"><strong>API Key:</strong> {source.apiKey || "-"}</p>
                          <p><strong>Notes:</strong> {source.notes || "-"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No score sources configured.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Delete match?</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                This will remove {deleteTarget.title || `${deleteTarget.teamA} vs ${deleteTarget.teamB}`} from the admin list.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="admin-secondary-btn">
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

      <WatchModal isOpen={!!watchData} onClose={() => setWatchData(null)} watchData={watchData} />
    </div>
  );
}

export default Matches;
