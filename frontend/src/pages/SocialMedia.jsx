import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Pencil, 
  X, 
  ExternalLink,
  Link as LinkIcon
} from "lucide-react";
import { 
  FaFacebook as Facebook, 
  FaInstagram as Instagram, 
  FaTwitter as Twitter, 
  FaYoutube as Youtube, 
  FaEnvelope as Mail,
  FaLinkedin as Linkedin
} from "react-icons/fa";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";

const PLATFORMS = [
  { value: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50" },
  { value: "twitter", label: "Twitter / X", icon: Twitter, color: "text-sky-500", bg: "bg-sky-50" },
  { value: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600", bg: "bg-red-50" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700", bg: "bg-blue-100" },
  { value: "email", label: "Email", icon: Mail, color: "text-emerald-600", bg: "bg-emerald-50" }
];

const getPlatformConfig = (val) => PLATFORMS.find((p) => p.value === val) || { icon: LinkIcon, color: "text-slate-500", bg: "bg-slate-50", label: val };

const defaultForm = {
  platform: "facebook",
  url: ""
};

function SocialMedia() {
  const [socials, setSocials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSocials = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/social-media");
      setSocials(Array.isArray(res?.data?.social) ? res.data.social : []);
    } catch (e) {
      setSocials([]);
      setError(e?.response?.data?.message || "Unable to load social media links.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSocials();
  }, []);

  const onFormChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (formErrors[key]) setFormErrors(p => ({ ...p, [key]: "" }));
  };

  const openCreate = () => {
    setEditMode(false);
    // Find first available platform that isn't already used
    const used = socials.map(s => s.platform);
    const available = PLATFORMS.find(p => !used.includes(p.value))?.value || "facebook";
    
    setForm({ platform: available, url: "" });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      platform: s.platform || "facebook",
      url: s.url || ""
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
    if (!form.platform) e.platform = "Platform is required";
    if (!form.url.trim()) e.url = "URL is required";
    
    // Check if platform already exists when creating
    if (!editMode && socials.some(s => s.platform === form.platform)) {
      e.platform = "This platform is already added.";
    }

    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveSocial = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      setError("");
      
      const payload = {
        platform: form.platform,
        url: form.url.trim()
      };

      const res = editMode
        ? await api.put(`/admin/social-media/${form.platform}`, { url: payload.url })
        : await api.post("/admin/social-media", payload);
      
      if (res?.data?.success) {
        await loadSocials();
        closeModal();
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save social link.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.platform) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/social-media/${deleteTarget.platform}`);
      setSocials(prev => prev.filter(s => s.platform !== deleteTarget.platform));
      setDeleteTarget(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to delete social link.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldCls = "h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100";

  return (
    <div>
      <PageHeader
        title="Social Media Links"
        subtitle="Manage your platform's social media presence and contact links."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadSocials}
              className="admin-toolbar-btn">
              <RefreshCw size={14} /> Refresh
            </button>
            <button type="button" onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400">
              <Plus size={15} /> Add Link
            </button>
          </div>
        }
      />

      {error ? (
        <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      ) : null}

      {loading ? (
        <Loader lines={4} />
      ) : socials.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center dark:bg-slate-900">
          <LinkIcon size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No social media links found. Create one to display it on the app.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {socials.map((social, index) => {
            const config = getPlatformConfig(social.platform);
            const Icon = config.icon;
            
            return (
              <motion.div
                key={social._id || social.platform}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-900"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bg} ${config.color} dark:bg-opacity-10`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEdit(social)}
                      className="admin-action-btn-square"
                      title="Edit Link"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => setDeleteTarget(social)}
                      className="admin-action-btn-danger-square"
                      title="Delete Link"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{config.label}</h3>
                  <a 
                    href={social.platform === "email" && !social.url.startsWith("mailto:") ? `mailto:${social.url}` : social.url}
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1.5 text-sm text-indigo-500 transition hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <span className="truncate max-w-[200px]">{social.url}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {editMode ? "Edit Social Link" : "Add Social Link"}
                  </h2>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              <form onSubmit={saveSocial} className="space-y-4">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Platform *</span>
                  <select 
                    value={form.platform} 
                    onChange={e => onFormChange("platform", e.target.value)} 
                    className={fieldCls}
                    disabled={editMode} // Cannot change platform while editing
                  >
                    {PLATFORMS.map(p => (
                      <option 
                        key={p.value} 
                        value={p.value}
                        disabled={!editMode && socials.some(s => s.platform === p.value)}
                      >
                        {p.label} {(!editMode && socials.some(s => s.platform === p.value)) ? "(Added)" : ""}
                      </option>
                    ))}
                  </select>
                  {formErrors.platform && <span className="mt-1 block text-xs text-rose-500">{formErrors.platform}</span>}
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">URL / Email Address *</span>
                  <div className="relative">
                    <LinkIcon size={14} className="absolute top-3.5 left-3 text-slate-400" />
                    <input 
                      value={form.url} 
                      onChange={e => onFormChange("url", e.target.value)} 
                      className={`${fieldCls} pl-9`} 
                      placeholder={form.platform === "email" ? "contact@example.com" : "https://..."} 
                    />
                  </div>
                  {formErrors.url && <span className="mt-1 block text-xs text-rose-500">{formErrors.url}</span>}
                </label>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal}
                    className="admin-secondary-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-70 dark:bg-indigo-500">
                    {submitting ? "Saving..." : "Save Link"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this link?"
        message={`Are you sure you want to remove the ${getPlatformConfig(deleteTarget?.platform).label} link?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Link"}
      />
    </div>
  );
}

export default SocialMedia;
