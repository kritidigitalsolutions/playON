import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Pencil, 
  X, 
  ExternalLink,
  Mic,
  Star,
  Image as ImageIcon,
  PlayCircle
} from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";

const PODCAST_TYPES = [
  { value: "youtube", label: "YouTube" },
  { value: "spotify", label: "Spotify" },
  { value: "audio", label: "Audio URL" },
  { value: "video", label: "Video URL" },
  { value: "other", label: "Other" }
];

const defaultForm = {
  _id: "",
  sportId: "",
  title: "",
  description: "",
  url: "",
  type: "youtube",
  duration: "",
  category: "",
  isFeatured: false,
  isPremium: false,
  status: "active",
  thumbnailFile: null,
  thumbnailPreview: ""
};

function Podcasts() {
  const [podcasts, setPodcasts] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      setError("");
      const [res, sportRes] = await Promise.all([
        api.get("/admin/podcasts"),
        api.get("/admin/sports")
      ]);
      setPodcasts(Array.isArray(res?.data?.podcasts) ? res.data.podcasts : []);
      setSports(Array.isArray(sportRes?.data?.sports) ? sportRes.data.sports : []);
    } catch (e) {
      setPodcasts([]);
      setError(e?.response?.data?.message || "Unable to load podcasts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPodcasts();
  }, []);

  const onFormChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (formErrors[key]) setFormErrors(p => ({ ...p, [key]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
      type: p.type || "youtube",
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
    if (!form.url.trim()) e.url = "URL is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const savePodcast = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      setError("");
      
      const formData = new FormData();
      formData.append("sportId", form.sportId);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("url", form.url.trim());
      formData.append("type", form.type);
      formData.append("duration", form.duration.trim());
      formData.append("category", form.category.trim());
      formData.append("isFeatured", form.isFeatured);
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
        await loadPodcasts();
        closeModal();
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save podcast.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/podcasts/${deleteTarget._id}`);
      setPodcasts(prev => prev.filter(p => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to delete podcast.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleFeatured = async (id) => {
    try {
      const res = await api.patch(`/admin/podcasts/${id}/feature`);
      if (res?.data?.success) {
        setPodcasts(prev => prev.map(p => 
          p._id === id ? { ...p, isFeatured: res.data.isFeatured } : p
        ));
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to update featured status.");
    }
  };

  const fieldCls = "h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100";

  return (
    <div>
      <PageHeader
        title="Podcasts"
        subtitle="Manage podcasts, audio shows, and video links."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadPodcasts}
              className="admin-toolbar-btn">
              <RefreshCw size={14} /> Refresh
            </button>
            <button type="button" onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400">
              <Plus size={15} /> Add Podcast
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {loading ? (
        <Loader lines={5} />
      ) : podcasts.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center dark:bg-slate-900">
          <Mic size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No podcasts found. Add one to show in the app.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {podcasts.map((podcast, index) => (
            <motion.div
              key={podcast._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-900"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                {podcast.thumbnail ? (
                  <img 
                    src={podcast.thumbnail} 
                    alt={podcast.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <PlayCircle size={48} className="text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute top-3 right-3 flex gap-2">
                  {podcast.isPremium && (
                    <span className="flex items-center rounded-full bg-violet-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      👑 Premium
                    </span>
                  )}
                  <button
                    onClick={() => toggleFeatured(podcast._id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur ${podcast.isFeatured ? 'bg-amber-400 text-white' : 'bg-white/50 text-slate-600 hover:bg-white/80'}`}
                    title={podcast.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
                  >
                    <Star size={14} className={podcast.isFeatured ? 'fill-current' : ''} />
                  </button>
                  <span className={`flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${podcast.status === 'active' ? "bg-emerald-500" : "bg-slate-500"}`}>
                    {podcast.status}
                  </span>
                </div>
                {podcast.duration && (
                  <div className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    {podcast.duration}
                  </div>
                )}
                {podcast.type && (
                  <div className="absolute bottom-3 left-3 rounded bg-indigo-500/90 px-2 py-1 text-xs font-semibold uppercase text-white shadow-sm">
                    {podcast.type}
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2">
                  <h3 className="line-clamp-2 font-semibold text-slate-900 dark:text-slate-100" title={podcast.title}>{podcast.title}</h3>
                  {podcast.sportId?.name && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      Sport: {podcast.sportId.name}
                    </p>
                  )}
                  {podcast.category && (
                    <p className="mt-1 text-xs text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-medium">
                      {podcast.category}
                    </p>
                  )}
                </div>

                <p className="mb-4 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                  {podcast.description || "No description provided."}
                </p>

                <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <a 
                    href={podcast.url}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-action-btn-square"
                    title="Open Link"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button 
                    onClick={() => openEdit(podcast)}
                    className="admin-action-btn-sm flex-1 py-2"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => setDeleteTarget(podcast)}
                    className="admin-action-btn-danger-square"
                    title="Delete Podcast"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 pretty-scroll">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {editMode ? "Edit Podcast" : "Add Podcast"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editMode ? "Update podcast details." : "Add a new podcast or audio/video show."}
                  </p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              <form onSubmit={savePodcast} className="space-y-4">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport *</span>
                  <select 
                    value={form.sportId} 
                    onChange={e => onFormChange("sportId", e.target.value)} 
                    className={fieldCls}
                  >
                    <option value="">Select Sport...</option>
                    {sports.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  {formErrors.sportId && <span className="mt-1 block text-xs text-rose-500">{formErrors.sportId}</span>}
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Title *</span>
                  <input 
                    value={form.title} 
                    onChange={e => onFormChange("title", e.target.value)} 
                    className={fieldCls} 
                    placeholder="Podcast title" 
                  />
                  {formErrors.title && <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span>}
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
                  <textarea 
                    value={form.description} 
                    onChange={e => onFormChange("description", e.target.value)} 
                    className={`${fieldCls} h-20 py-2 resize-none`} 
                    placeholder="Brief description..." 
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">URL / Link *</span>
                  <input 
                    value={form.url} 
                    onChange={e => onFormChange("url", e.target.value)} 
                    className={fieldCls} 
                    placeholder="https://..." 
                  />
                  {formErrors.url && <span className="mt-1 block text-xs text-rose-500">{formErrors.url}</span>}
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Type</span>
                    <select 
                      value={form.type} 
                      onChange={e => onFormChange("type", e.target.value)} 
                      className={fieldCls}
                    >
                      {PODCAST_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Duration</span>
                    <input 
                      value={form.duration} 
                      onChange={e => onFormChange("duration", e.target.value)} 
                      className={fieldCls} 
                      placeholder="e.g. 45:00" 
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Category</span>
                    <input 
                      value={form.category} 
                      onChange={e => onFormChange("category", e.target.value)} 
                      className={fieldCls} 
                      placeholder="e.g. Sports Talk" 
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Status</span>
                    <select 
                      value={form.status} 
                      onChange={e => onFormChange("status", e.target.value)} 
                      className={fieldCls}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <input 
                    type="checkbox" 
                    checked={form.isFeatured} 
                    onChange={e => onFormChange("isFeatured", e.target.checked)} 
                    className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" 
                  />
                  <span className="text-slate-700 dark:text-slate-200">Feature this podcast</span>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3 text-sm dark:border-violet-500/30 dark:bg-violet-500/10">
                  <input 
                    type="checkbox" 
                    checked={form.isPremium} 
                    onChange={e => onFormChange("isPremium", e.target.checked)} 
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" 
                  />
                  <span className="text-violet-700 dark:text-violet-300">👑 Premium Content <span className="text-xs text-slate-400">(subscription required to listen)</span></span>
                </label>

                <div className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Thumbnail Image</span>
                  <div className="group relative aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-indigo-400 dark:bg-slate-950">
                    {form.thumbnailPreview ? (
                      <>
                        <img src={form.thumbnailPreview} alt="Preview" className="h-full w-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setForm(p => ({ ...p, thumbnailFile: null, thumbnailPreview: "" }))}
                          className="absolute top-2 right-2 rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2">
                        <ImageIcon size={28} className="text-slate-300 transition-colors group-hover:text-indigo-400" />
                        <span className="text-xs text-slate-400">Click to upload thumbnail</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal}
                    className="admin-secondary-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-70 dark:bg-indigo-500">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Podcast"}
                  </button>
                </div>
              </form>
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
    </div>
  );
}

export default Podcasts;
