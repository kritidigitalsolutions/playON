import { useEffect, useState } from "react";
import { Eye, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";

const LEGAL_TYPES = [
  { id: "privacy-policy", label: "Privacy Policy" },
  { id: "terms-conditions", label: "Terms & Conditions" },
  { id: "refund-policy", label: "Refund Policy" }
];

function Legal() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [viewModal, setViewModal] = useState(null); // holds the page object to view
  const [editModal, setEditModal] = useState(null); // holds type id string
  const [deleteTarget, setDeleteTarget] = useState(null); // holds type id string
  
  const [form, setForm] = useState({ title: "", content: "", isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/legal");
      if (response.data?.success) {
        setPages(response.data.pages || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load legal pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const openEdit = (typeId) => {
    const existing = pages.find((p) => p.type === typeId);
    setEditModal(typeId);
    if (existing) {
      setForm({ title: existing.title, content: existing.content, isActive: existing.isActive });
    } else {
      const label = LEGAL_TYPES.find((t) => t.id === typeId)?.label || "";
      setForm({ title: label, content: "", isActive: true });
    }
  };

  const closeEdit = () => {
    setEditModal(null);
    setForm({ title: "", content: "", isActive: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/admin/legal/${editModal}`, {
        title: form.title,
        content: form.content
      });
      if (response.data?.success) {
        fetchPages();
        closeEdit();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save page");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/legal/${deleteTarget}`);
      setDeleteTarget(null);
      fetchPages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete page");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (page) => {
    if (!page) {
      return <span className="inline-flex rounded-full border border-slate-300/40 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">Not Created</span>;
    }
    if (page.isActive) {
      return <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Published</span>;
    }
    return <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">Draft / Inactive</span>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal Pages"
        subtitle="Manage public-facing compliance pages like Privacy Policy and Terms."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchPages}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-10 text-center text-slate-500">
            Loading pages...
          </div>
        ) : (
          LEGAL_TYPES.map((type) => {
            const existingPage = pages.find((p) => p.type === type.id);

            return (
              <div 
                key={type.id} 
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex-1 p-5 lg:p-6">
                  {/* Header / Title */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{type.label}</h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{type.id}</p>
                    </div>
                    {getStatusBadge(existingPage)}
                  </div>
                  
                  {/* Info */}
                  <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Document Title</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{existingPage ? existingPage.title : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Last Updated</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{existingPage ? new Date(existingPage.updatedAt).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                  <div className="flex items-center justify-end gap-2">
                    {existingPage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setViewModal(existingPage)}
                          title="View Page"
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                        >
                          <Eye size={15} /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(type.id)}
                          title="Edit Page"
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(type.id)}
                          title="Delete Page"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 text-rose-500 transition hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEdit(type.id)}
                        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                      >
                        <Pencil size={15} /> Create Document
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {editModal ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {pages.find((p) => p.type === editModal) ? "Edit Legal Page" : "Create Legal Page"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Editing {LEGAL_TYPES.find((t) => t.id === editModal)?.label}
                  </p>
                </div>
                <button type="button" onClick={closeEdit} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Document Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="content" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Content (Markdown / HTML)
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    rows={12}
                    className="w-full rounded-xl border border-slate-200 p-4 font-mono text-sm leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-500"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={closeEdit} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-70 dark:bg-indigo-500 dark:hover:bg-indigo-600">
                    {submitting ? "Saving..." : "Save Document"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewModal ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{viewModal.title}</h2>
                  <div className="mt-2 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span>{LEGAL_TYPES.find((t) => t.id === viewModal.type)?.label}</span>
                    <span>•</span>
                    <span>Last updated: {new Date(viewModal.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setViewModal(null)} className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="prose prose-slate max-w-none dark:prose-invert">
                {/* For simple display we just render the raw text/html. In production you might use a markdown parser or dangerouslySetInnerHTML. */}
                <div className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {viewModal.content}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Legal Document?"
        message={`Are you sure you want to delete the ${LEGAL_TYPES.find((t) => t.id === deleteTarget)?.label} document? This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Document"}
      />
    </div>
  );
}

export default Legal;
