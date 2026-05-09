import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  X,
  Image as ImageIcon,
  PlayCircle,
  MessageSquare,
  Eye,
  Star,
  Flame,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  Play,
  ArrowRight
} from "lucide-react";
import api from "../api/axios";
import CommentModal from "../components/CommentModal";

import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";

const PAGE_SIZE = 8;

const PODCAST_SOURCE_CATEGORIES = [
  "youtube",
  "spotify",
  "audio",
  "video",
  "soundcloud",
  "google_podcast",
  "apple_podcast",
  "iframe",
  "webview",
  "other"
];

const emptySource = {
  provider: "",
  category: "other",
  url: "",
  priority: 1,
  isActive: true,
  notes: ""
};

const defaultForm = {
  _id: "",
  sportId: "",
  title: "",
  description: "",
  url: "", // Legacy
  type: "other", // Legacy
  sources: [],
  duration: "",
  category: "",
  isFeatured: false,
  isPremium: false,
  status: "active",
  thumbnailFile: null,
  thumbnailPreview: ""
};

const classNames = (...parts) => parts.filter(Boolean).join(" ");

function Podcasts() {
  const [podcasts, setPodcasts] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [commentTarget, setCommentTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: "all", type: "all", sort: "newest", sport: "all" });

  const [toasts, setToasts] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [playingPodcast, setPlayingPodcast] = useState(null);

  const pushToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800);
  };

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      const [res, sportRes] = await Promise.all([
        api.get("/admin/podcasts"),
        api.get("/admin/sports")
      ]);
      setPodcasts(Array.isArray(res?.data?.podcasts) ? res.data.podcasts : []);
      setSports(Array.isArray(sportRes?.data?.sports) ? sportRes.data.sports : []);
    } catch (e) {
      setPodcasts([]);
      pushToast(e?.response?.data?.message || "Unable to load podcasts.", "error");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: podcasts.length,
      youtube: podcasts.filter(p => p.type === "youtube" || p.sources?.some(s => s.category === "youtube")).length,
      spotify: podcasts.filter(p => p.type === "spotify" || p.sources?.some(s => s.category === "spotify")).length,
      featured: podcasts.filter(p => p.isFeatured).length,
      premium: podcasts.filter(p => p.isPremium).length
    };
  }, [podcasts]);

  const filteredPodcasts = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = podcasts.filter(p => {
      const searchOk = !q || [p.title, p.description, p.category].filter(Boolean).join(" ").toLowerCase().includes(q);
      const statusOk = filters.status === "all" || p.status === filters.status;
      const sportOk = filters.sport === "all" || (p.sportId?._id || p.sportId) === filters.sport;
      const typeOk = filters.type === "all" || p.type === filters.type || p.sources?.some(s => s.category === filters.type);
      return searchOk && statusOk && sportOk && typeOk;
    });

    if (filters.sort === "az") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filters.sort === "oldest") {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [podcasts, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredPodcasts.length / PAGE_SIZE));
  const pageData = useMemo(() => filteredPodcasts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredPodcasts, page]);

  useEffect(() => {
    loadPodcasts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  const onFormChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (formErrors[key]) setFormErrors(p => ({ ...p, [key]: "" }));
  };

  const onSourceChange = (index, key, val) => {
    setForm(p => ({
      ...p,
      sources: p.sources.map((s, i) => i === index ? { ...s, [key]: val } : s)
    }));
  };

  const addSource = () => setForm(p => ({ ...p, sources: [...p.sources, { ...emptySource }] }));
  const removeSource = (index) => setForm(p => ({ ...p, sources: p.sources.filter((_, i) => i !== index) }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        pushToast("Thumbnail image is too large. Max 2MB allowed.", "error");
        e.target.value = "";
        return;
      }
      setForm(p => ({
        ...p,
        thumbnailFile: file,
        thumbnailPreview: URL.createObjectURL(file)
      }));
    }
  };

  const openCreate = () => {
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: p._id || "",
      sportId: p.sportId?._id || p.sportId || "",
      title: p.title || "",
      description: p.description || "",
      url: p.url || "",
      type: p.type || "other",
      sources: Array.isArray(p.sources) ? p.sources : [],
      duration: p.duration || "",
      category: p.category || "",
      isFeatured: Boolean(p.isFeatured),
      isPremium: Boolean(p.isPremium),
      status: p.status || "active",
      thumbnailFile: null,
      thumbnailPreview: p.thumbnail || ""
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.sportId) e.sportId = "Sport is required";
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.url.trim() && form.sources.length === 0) e.url = "URL or at least one source is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const savePodcast = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("sportId", form.sportId);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("url", form.url.trim());
      formData.append("type", form.type);
      formData.append("sources", JSON.stringify(form.sources));
      formData.append("duration", form.duration.trim());
      formData.append("category", form.category.trim());
      formData.append("isFeatured", String(Boolean(form.isFeatured)));
      formData.append("isPremium", String(Boolean(form.isPremium)));
      formData.append("status", form.status);

      if (form.thumbnailFile) {
        formData.append("thumbnail", form.thumbnailFile);
      }

      const res = editMode && form._id
        ? await api.put(`/admin/podcasts/${form._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        : await api.post("/admin/podcasts", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

      if (res?.data?.success) {
        pushToast(`Podcast ${editMode ? 'updated' : 'created'} successfully`, "success");
        await loadPodcasts();
        closeModal();
      }
    } catch (e) {
      pushToast(e?.response?.data?.message || "Unable to save podcast.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFeatured = async (podcast) => {
    const previous = podcast.isFeatured;
    setPodcasts(prev => prev.map(p => p._id === podcast._id ? { ...p, isFeatured: !p.isFeatured } : p));
    try {
      await api.patch(`/admin/podcasts/${podcast._id}/feature`);
      pushToast(`Featured ${previous ? "removed" : "enabled"}`, "success");
    } catch {
      setPodcasts(prev => prev.map(p => p._id === podcast._id ? { ...p, isFeatured: previous } : p));
      pushToast("Feature toggle failed", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/podcasts/${deleteTarget._id}`);
      setPodcasts(prev => prev.filter(p => p._id !== deleteTarget._id));
      pushToast("Podcast deleted", "success");
      setDeleteTarget(null);
    } catch (e) {
      pushToast(e?.response?.data?.message || "Unable to delete podcast.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
      let videoId = "";

      if (host === "youtu.be") {
        videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
      } else if (host.endsWith("youtube.com")) {
        if (parsed.pathname.startsWith("/embed/")) {
          videoId = parsed.pathname.split("/").filter(Boolean)[1] || "";
        } else if (parsed.pathname.startsWith("/shorts/")) {
          videoId = parsed.pathname.split("/").filter(Boolean)[1] || "";
        } else {
          videoId = parsed.searchParams.get("v") || "";
        }
      }

      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch {
      return url;
    }
  };

  const getSpotifyEmbedUrl = (url) => {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const type = parts[0];
      const id = parts[1];

      if (parsed.hostname.includes("spotify.com") && type && id) {
        return `https://open.spotify.com/embed/${type}/${id}`;
      }
    } catch {
      return url;
    }

    return url;
  };

  const getPlayerConfig = (podcast) => {
    if (!podcast?.url) return "";
    const lowerUrl = podcast.url.toLowerCase().split("?")[0];
    const isAudioUrl = /\.(mp3|m4a|aac|ogg|oga|wav)$/.test(lowerUrl);
    const isVideoUrl = /\.(mp4|webm|ogg|ogv|mov|m3u8)$/.test(lowerUrl);

    if (podcast.type === "audio" || isAudioUrl) {
      return { kind: "audio", src: podcast.url };
    }

    if (podcast.type === "video" || isVideoUrl) {
      return { kind: "video", src: podcast.url };
    }

    if (podcast.type === "youtube") {
      return { kind: "embed", src: getYouTubeEmbedUrl(podcast.url) };
    }

    if (podcast.type === "spotify") {
      return { kind: "embed", src: getSpotifyEmbedUrl(podcast.url) };
    }

    return { kind: "embed", src: podcast.url };
  };

  const fieldCls = "h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100";

  return (
    <div className="space-y-6">
      <Toasts toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))} />

      <PageHeader
        title="Podcasts"
        subtitle="Manage podcasts, audio shows, and video links."
        action={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button" onClick={loadPodcasts} className="admin-toolbar-btn">
              <RefreshCw size={15} /> Refresh
            </button>
            <button type="button" onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400">
              <Plus size={15} /> Add Podcast
            </button>
          </div>
        }
      />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Podcasts", value: stats.total, icon: PlayCircle, tone: "text-slate-700 dark:text-slate-200" },
          { label: "YouTube", value: stats.youtube, icon: Play, tone: "text-rose-600 dark:text-rose-300" },
          { label: "Spotify", value: stats.spotify, icon: Activity, tone: "text-emerald-600 dark:text-emerald-300" },
          { label: "Featured", value: stats.featured, icon: Star, tone: "text-amber-600 dark:text-amber-300" },
          { label: "Premium", value: stats.premium, icon: Flame, tone: "text-violet-600 dark:text-violet-300" }
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
              placeholder="Search by title, category..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={filters.sport}
            onChange={(e) => setFilters((prev) => ({ ...prev, sport: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="all">Sport: All</option>
            {sports.map((s) => <option key={s._id} value={s._id}>Sport: {s.name}</option>)}
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="all">Type: All</option>
            {PODCAST_SOURCE_CATEGORIES.map(t => <option key={t} value={t}>Type: {t.toUpperCase()}</option>)}
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

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilters({ status: "all", type: "all", sort: "newest", sport: "all" });
            }}
            className="admin-toolbar-btn"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white shadow-sm dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Podcast Directory</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{filteredPodcasts.length} total after filters</p>
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
              <thead className="bg-slate-100/70 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-3">Podcast / Episode</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {pageData.map((podcast) => (
                  <tr key={podcast._id} className="align-top hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {podcast.thumbnail ? (
                            <img src={podcast.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400"><PlayCircle size={18} /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={podcast.title}>{podcast.title}</p>
                            {podcast.isFeatured && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600">
                                <Star size={10} className="fill-current" /> Featured
                              </span>
                            )}
                            {podcast.isPremium && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-600 dark:text-violet-300">
                                👑 Premium
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                            {podcast.sportId?.name || "Unknown Sport"} • {podcast.duration || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold uppercase tracking-tight text-indigo-500">
                          {podcast.type}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{podcast.category || "No Category"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase border ${podcast.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700"}`}>
                        {podcast.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button onClick={() => setPlayingPodcast(podcast)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Play">
                          <Play size={15} />
                        </button>
                        <button onClick={() => setSelectedPodcast(podcast)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="View Details">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => setCommentTarget(podcast)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Comments">
                          <MessageSquare size={15} />
                        </button>
                        <button onClick={() => openEdit(podcast)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => toggleFeatured(podcast)} className={classNames("admin-action-btn-sm h-8 w-8 rounded-full !p-0", podcast.isFeatured ? "bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-400" : "")}>
                          <Star size={15} className={podcast.isFeatured ? "fill-current" : ""} />
                        </button>
                        <button onClick={() => setDeleteTarget(podcast)} className="admin-action-btn-danger-sm h-8 w-8 rounded-full !p-0" title="Delete">
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
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No podcasts found.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting filters or create a new podcast.</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Showing {pageData.length} of {filteredPodcasts.length} podcasts</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0 disabled:opacity-30">
              <ChevronLeft size={15} />
            </button>
            <span className="min-w-[70px] text-center text-sm text-slate-600 dark:text-slate-300">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0 disabled:opacity-30">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 pretty-scroll">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {editMode ? "Edit Podcast" : "Add Podcast"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editMode ? "Update podcast details and sources." : "Add a new podcast or audio/video show."}
                  </p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              <form onSubmit={savePodcast} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport *</span>
                    <select value={form.sportId} onChange={e => onFormChange("sportId", e.target.value)} className={fieldCls}>
                      <option value="">Select Sport...</option>
                      {sports.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                    {formErrors.sportId && <span className="mt-1 block text-xs text-rose-500">{formErrors.sportId}</span>}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Title *</span>
                    <input value={form.title} onChange={e => onFormChange("title", e.target.value)} className={fieldCls} placeholder="Podcast title" />
                    {formErrors.title && <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span>}
                  </label>
                </div>

                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
                  <textarea value={form.description} onChange={e => onFormChange("description", e.target.value)} className={`${fieldCls} h-20 py-2 resize-none`} placeholder="Brief description..." />
                </label>

                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Podcast Sources</span>
                    <button type="button" onClick={addSource} className="admin-action-btn-sm"><Plus size={14} /> Add Source</button>
                  </div>

                  {form.sources.length ? (
                    <div className="space-y-4">
                      {form.sources.map((source, index) => (
                        <div key={index} className="relative rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                          <button type="button" onClick={() => removeSource(index)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="block text-sm">
                              <span className="mb-1 block text-xs text-slate-500">Provider</span>
                              <input value={source.provider} onChange={e => onSourceChange(index, "provider", e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-900" placeholder="e.g. YouTube" />
                            </label>
                            <label className="block text-sm">
                              <span className="mb-1 block text-xs text-slate-500">Category</span>
                              <select value={source.category} onChange={e => onSourceChange(index, "category", e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-900">
                                {PODCAST_SOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                              </select>
                            </label>
                            <label className="block text-sm md:col-span-2">
                              <span className="mb-1 block text-xs text-slate-500">URL</span>
                              <input value={source.url} onChange={e => onSourceChange(index, "url", e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-900" placeholder="https://..." />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                      <p className="text-xs text-slate-500">No sources added yet. Use the button above to add a YouTube, Spotify or direct link.</p>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Legacy URL (Old)</span>
                    <input value={form.url} onChange={e => onFormChange("url", e.target.value)} className={fieldCls} placeholder="Fallback URL" />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Duration</span>
                    <input value={form.duration} onChange={e => onFormChange("duration", e.target.value)} className={fieldCls} placeholder="e.g. 45:00" />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Category</span>
                    <input value={form.category} onChange={e => onFormChange("category", e.target.value)} className={fieldCls} placeholder="e.g. Sports Talk" />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => onFormChange("isFeatured", e.target.checked)} className="h-4 w-4" />
                    <span>Featured</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/30 px-3 py-3 text-sm dark:border-violet-500/20 dark:bg-violet-500/5">
                    <input type="checkbox" checked={form.isPremium} onChange={e => onFormChange("isPremium", e.target.checked)} className="h-4 w-4 text-violet-500" />
                    <span className="text-violet-700 dark:text-violet-300">👑 Premium</span>
                  </label>
                  <select value={form.status} onChange={e => onFormChange("status", e.target.value)} className={fieldCls}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Thumbnail Image</span>
                  <div className="group relative aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-indigo-400 dark:bg-slate-950">
                    {form.thumbnailPreview ? (
                      <>
                        <img src={form.thumbnailPreview} alt="Preview" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setForm(p => ({ ...p, thumbnailFile: null, thumbnailPreview: "" }))} className="absolute top-2 right-2 rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70"><X size={14} /></button>
                      </>
                    ) : (
                      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2">
                        <ImageIcon size={28} className="text-slate-300 group-hover:text-indigo-400" />
                        <span className="text-xs text-slate-400">Click to upload thumbnail</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="admin-secondary-btn">Cancel</button>
                  <button type="submit" disabled={submitting} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-70 dark:bg-indigo-500">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Podcast"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {selectedPodcast && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Podcast Details</h2>
                <button type="button" onClick={() => setSelectedPodcast(null)} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              <div className="flex items-start gap-5">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-800">
                  {selectedPodcast.thumbnail ? (
                    <img src={selectedPodcast.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300"><PlayCircle size={32} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedPodcast.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{selectedPodcast.sportId?.name || "Unknown Sport"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${selectedPodcast.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{selectedPodcast.status}</span>
                    {selectedPodcast.isFeatured && <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">Featured</span>}
                    {selectedPodcast.isPremium && <span className="bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">👑 Premium</span>}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Duration</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedPodcast.duration || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Category</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedPodcast.category || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">ID</p>
                  <p className="mt-0.5 truncate text-[10px] font-mono text-slate-500">{selectedPodcast._id}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Sources ({selectedPodcast.sources?.length || 0})</p>
                <div className="space-y-2">
                  {selectedPodcast.sources?.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-lg bg-white shadow-sm dark:bg-slate-800">
                          {s.category === 'youtube' ? <Play size={14} className="text-rose-500" /> : <Activity size={14} className="text-indigo-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{s.provider || s.category.toUpperCase()}</p>
                          <p className="truncate text-[10px] text-slate-400">{s.url}</p>
                        </div>
                      </div>
                      <button onClick={() => { setPlayingPodcast({ ...selectedPodcast, url: s.url, type: s.category }); setSelectedPodcast(null); }} className="text-indigo-500 hover:text-indigo-600">
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  ))}
                  {!selectedPodcast.sources?.length && selectedPodcast.url && (
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Legacy URL ({selectedPodcast.type})</p>
                        <p className="truncate text-[10px] text-slate-400">{selectedPodcast.url}</p>
                      </div>
                      <button onClick={() => { setPlayingPodcast(selectedPodcast); setSelectedPodcast(null); }} className="text-indigo-500">
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setSelectedPodcast(null); openEdit(selectedPodcast); }} className="admin-secondary-btn flex-1">Edit</button>
                <button type="button" onClick={() => { setSelectedPodcast(null); setDeleteTarget(selectedPodcast); }} className="admin-action-btn-danger flex-1">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Modal */}
      <AnimatePresence>
        {playingPodcast && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{playingPodcast.title}</h2>
                  <p className="text-sm capitalize text-slate-500">{playingPodcast.type}</p>
                </div>
                <button type="button" onClick={() => setPlayingPodcast(null)} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              {getPlayerConfig(playingPodcast).kind === "audio" ? (
                <audio controls autoPlay className="w-full" src={getPlayerConfig(playingPodcast).src} />
              ) : getPlayerConfig(playingPodcast).kind === "video" ? (
                <video controls autoPlay className="max-h-[70vh] w-full rounded-xl bg-slate-950" src={getPlayerConfig(playingPodcast).src} />
              ) : (
                <div className="aspect-video overflow-hidden rounded-xl bg-slate-950 shadow-2xl">
                  <iframe
                    src={getPlayerConfig(playingPodcast).src}
                    title={playingPodcast.title}
                    className="h-full w-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this podcast?"
        message={`This will permanently remove "${deleteTarget?.title}".`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Podcast"}
      />

      <CommentModal
        open={Boolean(commentTarget)}
        onClose={() => setCommentTarget(null)}
        itemId={commentTarget?._id}
        itemName={commentTarget?.title}
      />

      <Toasts toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}

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

export default Podcasts;
