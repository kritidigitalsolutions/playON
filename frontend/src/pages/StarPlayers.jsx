import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Pencil, Plus, RefreshCw, Star, Trash2, Video, X } from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";

const defaultForm = {
  _id: "",
  sportId: "",
  playerId: "",
  playerName: "",
  team: "",
  title: "",
  videoUrl: "",
  type: "other",
  duration: "",
  isFeatured: false,
  isPremium: false,
  thumbnailFile: null
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      thumbnailFile: null
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            Loading highlights...
          </div>
        ) : null}

        {!loading && !filteredHighlights.length ? (
          <div className="col-span-full rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            No highlights found.
          </div>
        ) : null}

        {filteredHighlights.map((hl, index) => (
          <motion.div
            key={hl._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900"
          >
            <div className="relative h-60 w-full bg-slate-950 dark:bg-slate-950">
              {hl.thumbnail ? (
                <img src={hl.thumbnail} alt={hl.title} className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Video size={32} />
                </div>
              )}
              {hl.isFeatured && (
                <div className="absolute left-2 top-2 rounded-lg bg-amber-500 px-2 py-1 text-xs font-bold text-white shadow-sm flex items-center gap-1">
                  <Star size={12} className="fill-current" /> Featured
                </div>
              )}
              {hl.isPremium && (
                <div className="absolute right-2 top-2 rounded-lg bg-violet-600 px-2 py-1 text-xs font-bold text-white shadow-sm flex items-center gap-1">
                  👑 Premium
                </div>
              )}
              {hl.duration && (
                <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                  {hl.duration}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-100" title={hl.title}>
                {hl.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-indigo-500 dark:text-indigo-400">
                {hl.playerName} {hl.team ? `(${hl.team})` : ""}
              </p>
              <p className="mt-2 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                Sport: {hl.sportId?.name || "Unknown"}
              </p>

              <div className="mt-auto pt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedHighlight(hl)}
                  className="admin-action-btn"
                >
                  <Eye size={14} /> View
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(hl)}
                  className="admin-action-btn"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(hl)}
                  className="admin-action-btn-danger"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Player</span>
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
                      <option value="">Select a player...</option>
                      {players.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.team || "No Team"})
                        </option>
                      ))}
                    </select>
                    {formErrors.playerId ? <span className="mt-1 block text-xs text-rose-500">{formErrors.playerId}</span> : null}
                  </label>

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
                      onChange={(e) => onFormChange("thumbnailFile", e.target.files?.[0] || null)}
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
        {selectedHighlight ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedHighlight.title}</h2>
                  <p className="mt-1 text-sm text-indigo-500 dark:text-indigo-400">{selectedHighlight.playerName} {selectedHighlight.team && `(${selectedHighlight.team})`}</p>
                </div>
                <button type="button" onClick={() => setSelectedHighlight(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 relative aspect-video bg-black">
                {selectedHighlight.type === "youtube" ? (
                  <iframe
                    src={selectedHighlight.videoUrl.replace("watch?v=", "embed/")}
                    title={selectedHighlight.title || "Video player"}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : selectedHighlight.type === "mp4" ? (
                  <video src={selectedHighlight.videoUrl} className="w-full h-full object-contain" controls />
                ) : selectedHighlight.thumbnail ? (
                  <img src={selectedHighlight.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">No Preview</div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p><strong>Sport:</strong> {selectedHighlight.sportId?.name || "-"}</p>
                <p><strong>Player:</strong> {selectedHighlight.playerId?.name || "-"}</p>
                <p><strong>Type:</strong> {selectedHighlight.type}</p>
                <p><strong>Duration:</strong> {selectedHighlight.duration || "-"}</p>
                <p><strong>Featured:</strong> {selectedHighlight.isFeatured ? "Yes" : "No"}</p>
                <p><strong>Premium:</strong> {selectedHighlight.isPremium ? "👑 Yes (subscription required)" : "No (free)"}</p>
                <p><strong>URL:</strong> <a href={selectedHighlight.videoUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline break-all">{selectedHighlight.videoUrl}</a></p>
              </div>
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
    </div>
  );
}

export default StarPlayers;
