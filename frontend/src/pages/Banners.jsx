import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  MousePointer2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X
} from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
// import Loader from "../components/Loader";

const POSITIONS = [
  { label: "Home Top", value: "home_top" },
  { label: "Home Bottom", value: "home_bottom" },
  { label: "Match Details", value: "match_details" },
  { label: "Live TV Top", value: "livetv_top" }
];

const defaultForm = {
  _id: "",
  title: "",
  link: "",
  position: "home_top",
  sortOrder: 0,
  isActive: true,
  imageFile: null,
  imagePreview: ""
};

function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/banner-ads");
      setBanners(Array.isArray(res?.data?.banners) ? res.data.banners : []);
    } catch (e) {
      setBanners([]);
      setError(e?.response?.data?.message || "Unable to load banners.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadBanners();
  }, []);

  const onFormChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (formErrors[key]) setFormErrors(p => ({ ...p, [key]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Banner image is too large. Max 2MB allowed.");
        e.target.value = "";
        return;
      }
      setForm(p => ({
        ...p,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };


  const openCreate = () => {
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: b._id || "",
      title: b.title || "",
      link: b.link || "",
      position: b.position || "home_top",
      sortOrder: b.sortOrder || 0,
      isActive: Boolean(b.isActive),
      imageFile: null,
      imagePreview: b.image || ""
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
    if (!form.title.trim()) e.title = "Title is required";
    if (!editMode && !form.imageFile) e.image = "Image is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveBanner = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("link", form.link.trim());
      formData.append("position", form.position);
      formData.append("sortOrder", form.sortOrder);
      formData.append("isActive", form.isActive);
      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }

      const res = editMode && form._id
        ? await api.put(`/admin/banner-ads/${form._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        : await api.post("/admin/banner-ads", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

      if (res?.data?.success) {
        await loadBanners();
        closeModal();
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save banner.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/banner-ads/${deleteTarget._id}`);
      setBanners(prev => prev.filter(b => b._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to delete banner.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldCls = "h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100";

  return (
    <div>
      <PageHeader
        title="Banner Ads"
        subtitle="Manage promotional banners and advertisements across the app."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadBanners}
              className="admin-toolbar-btn">
              <RefreshCw size={14} /> Refresh
            </button>
            <button type="button" onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400">
              <Plus size={15} /> Add Banner
            </button>
          </div>
        }
      />

      {error ? (
        <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl bg-white shadow-sm dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No banners found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-100/70 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Banner / Preview</th>
                  <th className="px-4 py-3 font-medium">Position / Stats</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {banners.map((banner) => (
                  <tr key={banner._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {banner.image ? (
                            <img src={banner.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon size={16} /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={banner.title}>{banner.title}</p>
                          {banner.link && <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{banner.link}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400">
                          {banner.position.replace("_", " ")}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-indigo-500 font-medium">
                          <MousePointer2 size={10} />
                          <span>{banner.clicks || 0} Clicks</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase ${banner.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                        {banner.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedBanner(banner)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEdit(banner)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(banner)} className="admin-action-btn-danger-sm h-8 w-8 rounded-full !p-0" title="Delete">
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


      {/* View Modal */}
      <AnimatePresence>
        {selectedBanner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
              <div className="relative aspect-[16/7] w-full bg-slate-100 dark:bg-slate-800">
                <img src={selectedBanner.image} alt={selectedBanner.title} className="h-full w-full object-contain" />
                <button
                  onClick={() => setSelectedBanner(null)}
                  className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedBanner.title}</h2>
                    <p className="mt-1 text-slate-500 capitalize">{selectedBanner.position.replace("_", " ")} Position</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${selectedBanner.isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {selectedBanner.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Total Clicks</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{selectedBanner.clicks || 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Sort Order</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{selectedBanner.sortOrder || 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Created At</p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {new Date(selectedBanner.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedBanner.link && (
                  <div className="mb-6">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Target URL</p>
                    <a
                      href={selectedBanner.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl bg-indigo-50/50 p-3 text-sm text-indigo-600 transition hover:bg-indigo-50 dark:bg-indigo-900/10 dark:text-indigo-400"
                    >
                      <span className="truncate">{selectedBanner.link}</span>
                      <ExternalLink size={16} className="shrink-0" />
                    </a>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const b = selectedBanner;
                      setSelectedBanner(null);
                      openEdit(b);
                    }}
                    className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    Edit Banner
                  </button>
                  <button
                    onClick={() => setSelectedBanner(null)}
                    className="admin-secondary-btn flex-1 py-3"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    {editMode ? "Edit Banner" : "Create New Banner"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editMode ? "Update banner details and image." : "Upload an image and set the target link and position."}
                  </p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              <form onSubmit={saveBanner} className="space-y-4">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Banner Title *</span>
                  <input
                    value={form.title}
                    onChange={e => onFormChange("title", e.target.value)}
                    className={fieldCls}
                    placeholder="e.g. IPL Final Special Offer"
                  />
                  {formErrors.title && <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span>}
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Display Position</span>
                    <select
                      value={form.position}
                      onChange={e => onFormChange("position", e.target.value)}
                      className={fieldCls}
                    >
                      {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sort Order</span>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={e => onFormChange("sortOrder", e.target.value)}
                      className={fieldCls}
                    />
                  </label>
                </div>

                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Target URL (Link)</span>
                  <div className="relative">
                    <LinkIcon size={14} className="absolute top-3.5 left-3 text-slate-400" />
                    <input
                      value={form.link}
                      onChange={e => onFormChange("link", e.target.value)}
                      className={`${fieldCls} pl-9`}
                      placeholder="https://..."
                    />
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => onFormChange("isActive", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                  />
                  <span className="text-slate-700 dark:text-slate-200">Banner is active</span>
                </label>

                <div className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Banner Image {editMode ? "(Leave empty to keep current)" : "*"}</span>
                  <div className="group relative aspect-[16/6] w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-indigo-400 dark:bg-slate-950">
                    {form.imagePreview ? (
                      <>
                        <img src={form.imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, imageFile: null, imagePreview: "" }))}
                          className="absolute top-2 right-2 rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2">
                        <ImageIcon size={28} className="text-slate-300 transition-colors group-hover:text-indigo-400" />
                        <span className="text-xs text-slate-400">Click to upload image (16:7 recommended)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                  {formErrors.image && <span className="mt-1 block text-xs text-rose-500">{formErrors.image}</span>}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="admin-secondary-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-70 dark:bg-indigo-500">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Banner"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this banner?"
        message={`This will permanently remove the banner advertisement "${deleteTarget?.title}".`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Banner"}
      />
    </div>
  );
}

export default Banners;
