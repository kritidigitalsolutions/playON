import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, MessageSquare, Pencil, Play, Plus, RefreshCw, Trash2, Video, X } from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import CommentModal from "../components/CommentModal";
import PageHeader from "../components/PageHeader";


const defaultForm = {
  _id: "",
  sportId: "",
  playerId: "",
  playerName: "",
  team: "",
  title: "",
  videoUrl: "", // Legacy
  type: "other", // Legacy
  sources: [],
  duration: "",
  isFeatured: false,
  isPremium: false,
  thumbnailFile: null
};

const emptySource = {
  provider: "",
  category: "youtube",
  url: "",
  isActive: true
};

const SOURCE_CATEGORIES = [
  "youtube",
  "mp4",
  "m3u8",
  "iframe",
  "audio",
  "other"
];

const defaultPlayerForm = {
  name: "",
  sport: "cricket",
  team: "",
  position: "",
  country: "",
  bio: "",
  status: "active",
  featured: false,
  imageFile: null
};

function StarPlayers() {
  const [highlights, setHighlights] = useState([]);
  const [sports, setSports] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [playingHighlight, setPlayingHighlight] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [commentTarget, setCommentTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);


  // Player Creation Modal State
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [playerForm, setPlayerForm] = useState(defaultPlayerForm);
  const [playerFormErrors, setPlayerFormErrors] = useState({});
  const [playerSubmitting, setPlayerSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [hlRes, sportRes, playerRes] = await Promise.all([
        api.get("/admin/star-players"),
        api.get("/admin/sports"),
        api.get("/admin/players", { params: { limit: 1000 } })
      ]);

      const items = Array.isArray(hlRes?.data?.highlights) ? hlRes.data.highlights : [];
      setHighlights(items);

      const sItems = Array.isArray(sportRes?.data?.sports) ? sportRes.data.sports : [];
      setSports(sItems);

      const pItems = Array.isArray(playerRes?.data?.players) ? playerRes.data.players : [];
      setPlayers(pItems);
    } catch (apiError) {
      setHighlights([]);
      setError(apiError?.response?.data?.message || "Unable to load star players data.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, []);

  const filteredHighlights = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return highlights;

    return highlights.filter((item) => {
      const text = [item.playerName, item.title, item.team, item.sportId?.name, item.playerId?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [highlights, search]);

  const onFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const openCreate = () => {
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (hl) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: hl?._id || "",
      sportId: hl?.sportId?._id || hl?.sportId || "",
      playerId: hl?.playerId?._id || hl?.playerId || "",
      playerName: hl?.playerName || "",
      team: hl?.team || "",
      title: hl?.title || "",
      videoUrl: hl?.videoUrl || "",
      type: hl?.type || "other",
      duration: hl?.duration || "",
      isFeatured: Boolean(hl?.isFeatured),
      isPremium: Boolean(hl?.isPremium),
      thumbnailFile: null,
      sources: hl?.sources || []
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
    const nextErrors = {};
    if (!form.sportId) nextErrors.sportId = "Sport is required";
    if (!form.playerId) nextErrors.playerId = "Player is required";
    if (!form.playerName?.trim()) nextErrors.playerName = "Player name is required";
    if (!form.title?.trim()) nextErrors.title = "Title is required";
    if (!form.videoUrl?.trim()) nextErrors.videoUrl = "Video URL is required";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveHighlight = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = new FormData();
      payload.append("sportId", form.sportId);
      payload.append("playerId", form.playerId);
      payload.append("playerName", form.playerName);
      payload.append("team", form.team || "");
      payload.append("title", form.title);
      payload.append("videoUrl", form.videoUrl);
      payload.append("type", form.type || "other");
      payload.append("duration", form.duration || "");
      payload.append("isFeatured", String(Boolean(form.isFeatured)));
      payload.append("isPremium", String(Boolean(form.isPremium)));
      payload.append("sources", JSON.stringify(form.sources || []));
      if (form.thumbnailFile) payload.append("thumbnail", form.thumbnailFile);

      let response;
      if (editMode && form._id) {
        response = await api.put(`/admin/star-players/${form._id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        response = await api.post("/admin/star-players", payload, { headers: { "Content-Type": "multipart/form-data" } });
      }

      const saved = response?.data?.highlight;
      if (saved) {
        await loadData(); // Reload to get populated sport details
      }

      closeModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save highlight.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleting(true);
      setError("");
      await api.delete(`/admin/star-players/${deleteTarget._id}`);
      setHighlights((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete highlight.");
    } finally {
      setDeleting(false);
    }
  };

  const handleWatch = async (hl) => {
    try {
      const response = await api.get(`/admin/star-players/watch/${hl._id}`);
      if (response.data.success) {
        setPlayingHighlight(response.data.highlight);
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to load playback data.");
    }
  };

  const savePlayer = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!playerForm.name?.trim()) nextErrors.name = "Player name is required";
    if (!playerForm.sport?.trim()) nextErrors.sport = "Sport is required";
    setPlayerFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setPlayerSubmitting(true);
      const payload = new FormData();
      payload.append("name", playerForm.name || "");
      payload.append("sport", playerForm.sport || "");
      payload.append("team", playerForm.team || "");
      payload.append("position", playerForm.position || "");
      payload.append("country", playerForm.country || "");
      payload.append("bio", playerForm.bio || "");
      payload.append("status", playerForm.status || "active");
      payload.append("featured", String(Boolean(playerForm.featured)));
      if (playerForm.imageFile) payload.append("image", playerForm.imageFile);

      const response = await api.post("/admin/players", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const saved = response?.data?.player;
      if (saved?._id) {
        // Add to local players list
        setPlayers((prev) => [saved, ...prev]);
        // Select this player in the main form
        setForm((prev) => ({
          ...prev,
          playerId: saved._id,
          playerName: saved.name,
          team: saved.team || prev.team,
        }));
      }
      setPlayerModalOpen(false);
      setPlayerForm(defaultPlayerForm);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to create player.");
    } finally {
      setPlayerSubmitting(false);
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
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    } catch { return url; }
  };

  return (
    <div>
      <PageHeader
        title="Star Players & Highlights"
        subtitle="Manage star player video highlights linked to sports."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="admin-toolbar-btn"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={15} /> Add Highlight
            </button>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-rose-500">{error}</p> : null}

      <div className="mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by player name, title, or sport..."
          className="h-11 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
        />
      </div>

      <section className="rounded-2xl bg-white shadow-sm dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading highlights...</div>
        ) : !filteredHighlights.length ? (
          <div className="p-10 text-center text-sm text-slate-500">No highlights found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-100/70 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Highlight</th>
                  <th className="px-4 py-3 font-medium">Player / Sport</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredHighlights.map((hl) => (
                  <tr key={hl._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {hl.thumbnail ? (
                            <img src={hl.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300"><Video size={14} /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[250px]" title={hl.title}>{hl.title}</p>
                          {hl.duration && <span className="text-[10px] text-slate-400">{hl.duration}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{hl.playerName}</p>
                        <p className="text-[10px] text-slate-500">{hl.sportId?.name || "Unknown"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {hl.isFeatured && <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600">Featured</span>}
                        {hl.isPremium && <span className="inline-flex rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold text-violet-600">Premium</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleWatch(hl)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0 bg-indigo-500/10 text-indigo-600 border-indigo-200" title="Play">
                          <Play size={14} />
                        </button>
                        <button onClick={() => setSelectedHighlight(hl)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="View Details">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEdit(hl)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setCommentTarget(hl)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Comments">
                          <MessageSquare size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(hl)} className="admin-action-btn-danger-sm h-8 w-8 rounded-full !p-0" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>


      <AnimatePresence>
        {modalOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Highlight" : "Create Highlight"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add or update a star player's video highlight.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveHighlight} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport</span>
                    <select
                      value={form.sportId}
                      onChange={(e) => onFormChange("sportId", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                    >
                      <option value="">Select a sport...</option>
                      {sports.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.sportId ? <span className="mt-1 block text-xs text-rose-500">{formErrors.sportId}</span> : null}
                  </label>

                  <div className="md:col-span-2 space-y-4">
                    <label className="block text-sm">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Option 1: Choose Existing Player</span>
                      <select
                        value={form.playerId}
                        onChange={(e) => {
                          const pid = e.target.value;
                          const p = players.find(x => x._id === pid);
                          setForm(prev => ({
                            ...prev,
                            playerId: pid,
                            playerName: p ? p.name : prev.playerName,
                            team: p ? p.team : prev.team,
                            sportId: p ? (p.sportId?._id || p.sportId || prev.sportId) : prev.sportId
                          }));
                          if (formErrors.playerId) setFormErrors(prev => ({ ...prev, playerId: "" }));
                        }}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                      >
                        <option value="">Select an existing player...</option>
                        {players.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.team || "No Team"})
                          </option>
                        ))}
                      </select>
                      {formErrors.playerId ? <span className="mt-1 block text-xs text-rose-500">{formErrors.playerId}</span> : null}
                    </label>

                    <div className="relative flex items-center py-1">
                      <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                      <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                      <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    </div>

                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setPlayerForm({
                            ...defaultPlayerForm,
                            sport: sports.find(s => s._id === form.sportId)?.name?.toLowerCase() || "cricket"
                          });
                          setPlayerModalOpen(true);
                        }}
                        className="flex w-full h-11 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-800 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                      >
                        <Plus size={16} /> Option 2: Create New Player
                      </button>
                      <p className="mt-2 text-[10px] text-slate-400 text-center uppercase tracking-tighter">Adds player to master list immediately</p>
                    </div>
                  </div>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Player Name (Display)</span>
                    <input
                      value={form.playerName}
                      onChange={(e) => onFormChange("playerName", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                      placeholder="e.g. Virat Kohli"
                    />
                    {formErrors.playerName ? <span className="mt-1 block text-xs text-rose-500">{formErrors.playerName}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team (Optional)</span>
                    <input
                      value={form.team}
                      onChange={(e) => onFormChange("team", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                      placeholder="e.g. India"
                    />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Highlight Title</span>
                    <input
                      value={form.title}
                      onChange={(e) => onFormChange("title", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                      placeholder="e.g. Kohli's amazing cover drive"
                    />
                    {formErrors.title ? <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span> : null}
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Video URL</span>
                    <input
                      value={form.videoUrl}
                      onChange={(e) => onFormChange("videoUrl", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                      placeholder="e.g. https://youtube.com/..."
                    />
                    {formErrors.videoUrl ? <span className="mt-1 block text-xs text-rose-500">{formErrors.videoUrl}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Video Type</span>
                    <select
                      value={form.type}
                      onChange={(e) => onFormChange("type", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="mp4">MP4</option>
                      <option value="iframe">Iframe</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Duration (Optional)</span>
                    <input
                      value={form.duration}
                      onChange={(e) => onFormChange("duration", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                      placeholder="e.g. 05:20"
                    />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Thumbnail Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 2 * 1024 * 1024) {
                          setError("Thumbnail is too large. Max 2MB allowed.");
                          e.target.value = "";
                          return;
                        }
                        onFormChange("thumbnailFile", file || null);
                      }}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
                    />

                  </label>

                  <label className="block text-sm flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => onFormChange("isFeatured", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Featured Highlight</span>
                  </label>

                  <label className="block text-sm flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={form.isPremium}
                      onChange={(e) => onFormChange("isPremium", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Premium Content <span className="text-xs text-slate-400">(requires active subscription to watch)</span></span>
                  </label>
                </div>

                {/* Sources Section */}
                <div className="space-y-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Video Sources</p>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, sources: [...(p.sources || []), { ...emptySource }] }))}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-600"
                    >
                      <Plus size={14} /> Add Source
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(form.sources || []).map((source, idx) => (
                      <div key={idx} className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, sources: p.sources.filter((_, i) => i !== idx) }))}
                          className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1 text-white shadow-lg hover:bg-rose-600"
                        >
                          <X size={12} />
                        </button>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select
                            value={source.category}
                            onChange={(e) => {
                              const newSources = [...form.sources];
                              newSources[idx].category = e.target.value;
                              setForm(p => ({ ...p, sources: newSources }));
                            }}
                            className="h-9 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-indigo-400 dark:bg-slate-900 dark:text-slate-100"
                          >
                            {SOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                          </select>
                          <input
                            value={source.provider}
                            onChange={(e) => {
                              const newSources = [...form.sources];
                              newSources[idx].provider = e.target.value;
                              setForm(p => ({ ...p, sources: newSources }));
                            }}
                            placeholder="Provider (e.g. YouTube)"
                            className="h-9 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-indigo-400 dark:bg-slate-900 dark:text-slate-100"
                          />
                          <input
                            value={source.url}
                            onChange={(e) => {
                              const newSources = [...form.sources];
                              newSources[idx].url = e.target.value;
                              setForm(p => ({ ...p, sources: newSources }));
                            }}
                            placeholder="Source URL"
                            className="h-9 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 sm:col-span-2"
                          />
                        </div>
                      </div>
                    ))}
                    {!form.sources?.length && (
                      <p className="py-4 text-center text-xs text-slate-400">No multi-sources added. Using fallback URL above.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="admin-secondary-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70 hover:from-indigo-600 hover:to-violet-600">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Highlight"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {playingHighlight ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{playingHighlight.title}</h2>
                  <p className="mt-1 text-sm text-indigo-500 dark:text-indigo-400">{playingHighlight.playerName} {playingHighlight.team && `(${playingHighlight.team})`}</p>
                </div>
                <button type="button" onClick={() => setPlayingHighlight(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 relative aspect-video bg-black shadow-2xl">
                {(() => {
                  const url = (playingHighlight.videoUrl || playingHighlight.url || "").toLowerCase();
                  const type = (playingHighlight.type || playingHighlight.category || "").toLowerCase();
                  
                  // YouTube
                  if (type === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
                    return (
                      <iframe
                        src={getYouTubeEmbedUrl(playingHighlight.videoUrl || playingHighlight.url)}
                        title={playingHighlight.title || "Video player"}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  
                  // Iframe
                  if (type === "iframe") {
                    return (
                      <iframe
                        src={playingHighlight.videoUrl || playingHighlight.url}
                        title={playingHighlight.title || "Iframe content"}
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    );
                  }
                  
                  // Video (MP4, M3U8, etc)
                  if (type === "mp4" || type === "m3u8" || url.endsWith(".m3u8") || url.endsWith(".mp4") || url.includes(".m3u8?") || url.includes(".mp4?")) {
                    return <video src={playingHighlight.videoUrl || playingHighlight.url} className="w-full h-full object-contain" controls autoPlay />;
                  }

                  // Fallback
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                      <Video size={40} className="mb-3 opacity-20" />
                      <p className="font-medium text-sm">Preview not available for this format.</p>
                      <p className="text-[10px] mt-1 opacity-60 break-all max-w-xs">{playingHighlight.videoUrl || playingHighlight.url}</p>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHighlight ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Highlight Details</h2>
                  <p className="mt-1 text-sm text-slate-500">Full metadata and management options.</p>
                </div>
                <button type="button" onClick={() => setSelectedHighlight(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                  {selectedHighlight.thumbnail ? (
                    <img src={selectedHighlight.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300"><Video size={24} /></div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">{selectedHighlight.title}</h3>
                  <p className="text-sm text-indigo-500 font-medium mt-1">{selectedHighlight.playerName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sport</p>
                  <p className="font-medium">{selectedHighlight.sportId?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Type</p>
                  <p className="font-medium capitalize">{selectedHighlight.type}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duration</p>
                  <p className="font-medium">{selectedHighlight.duration || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Premium</p>
                  <p className="font-medium">{selectedHighlight.isPremium ? "👑 Yes" : "Free"}</p>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Sources ({selectedHighlight.sources?.length || 0})</p>
                <div className="space-y-2">
                  {selectedHighlight.sources?.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase">{s.category} - {s.provider || "Other"}</p>
                        <p className="truncate text-[10px] text-slate-500">{s.url}</p>
                      </div>
                      <button 
                        onClick={() => { setPlayingHighlight({ ...selectedHighlight, url: s.url, category: s.category }); setSelectedHighlight(null); }}
                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Play size={12} />
                      </button>
                    </div>
                  ))}
                  {!selectedHighlight.sources?.length && selectedHighlight.videoUrl && (
                    <div className="flex items-center justify-between rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fallback URL</p>
                        <p className="truncate text-[10px] text-slate-500">{selectedHighlight.videoUrl}</p>
                      </div>
                      <button 
                        onClick={() => { setPlayingHighlight(selectedHighlight); setSelectedHighlight(null); }}
                        className="p-1.5 text-indigo-500"
                      >
                        <Play size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setSelectedHighlight(null); handleWatch(selectedHighlight); }} className="admin-toolbar-btn flex-1 py-2.5 justify-center"><Play size={14} /> Watch Preview</button>
                <button type="button" onClick={() => { setSelectedHighlight(null); openEdit(selectedHighlight); }} className="admin-secondary-btn flex-1 py-2.5 justify-center"><Pencil size={14} /> Edit</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {playerModalOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create New Player</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add a new player to the platform.</p>
                </div>
                <button type="button" onClick={() => setPlayerModalOpen(false)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={savePlayer} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Player Name</span>
                    <input
                      value={playerForm.name}
                      onChange={(e) => setPlayerForm(p => ({ ...p, name: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                    {playerFormErrors.name ? <span className="mt-1 block text-xs text-rose-500">{playerFormErrors.name}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport</span>
                    <select
                      value={playerForm.sport}
                      onChange={(e) => setPlayerForm(p => ({ ...p, sport: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {sports.map((item) => (
                        <option key={item._id} value={item.name.toLowerCase()}>
                          {item.name}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                    {playerFormErrors.sport ? <span className="mt-1 block text-xs text-rose-500">{playerFormErrors.sport}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team</span>
                    <input
                      value={playerForm.team}
                      onChange={(e) => setPlayerForm(p => ({ ...p, team: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Position</span>
                    <input
                      value={playerForm.position}
                      onChange={(e) => setPlayerForm(p => ({ ...p, position: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Country</span>
                    <input
                      value={playerForm.country}
                      onChange={(e) => setPlayerForm(p => ({ ...p, country: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Status</span>
                    <select
                      value={playerForm.status}
                      onChange={(e) => setPlayerForm(p => ({ ...p, status: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Player Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 2 * 1024 * 1024) {
                          setError("Player image is too large. Max 2MB allowed.");
                          e.target.value = "";
                          return;
                        }
                        setPlayerForm(p => ({ ...p, imageFile: file || null }));
                      }}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:text-slate-100"
                    />

                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Bio</span>
                    <textarea
                      rows="3"
                      value={playerForm.bio}
                      onChange={(e) => setPlayerForm(p => ({ ...p, bio: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setPlayerModalOpen(false)} className="admin-secondary-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={playerSubmitting} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                    {playerSubmitting ? "Creating..." : "Create Player"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Highlight?"
        message={`This will permanently remove ${deleteTarget?.title || "this highlight"}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Highlight"}
      />

      <CommentModal
        open={Boolean(commentTarget)}
        onClose={() => setCommentTarget(null)}
        itemId={commentTarget?._id}
        itemName={commentTarget?.title}
      />
    </div>

  );
}

export default StarPlayers;
