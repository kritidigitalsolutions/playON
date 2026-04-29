import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Circle, 
  Eye,
  Pencil, 
  Plus, 
  Radio, 
  RefreshCw, 
  Shield, 
  Trash2, 
  Trophy, 
  X 
} from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";

const iconBySport = {
  cricket: Trophy,
  football: Shield,
  basketball: Circle,
  kabaddi: Radio,
  tennis: Circle,
  volleyball: Circle,
  other: Trophy
};

const defaultForm = {
  _id: "",
  name: "",
  isActive: true
};

function Sports() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedSport, setSelectedSport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // const [actionId, setActionId] = useState("");

  const loadSports = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/sports");
      setSports(Array.isArray(res?.data?.sports) ? res.data.sports : []);
    } catch (e) {
      setSports([]);
      setError(e?.response?.data?.message || "Unable to load sports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSports();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sports.filter(s => {
      const text = [s.name, s.slug].filter(Boolean).join(" ").toLowerCase();
      return !q || text.includes(q);
    });
  }, [sports, search]);

  const onFormChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (formErrors[key]) setFormErrors(p => ({ ...p, [key]: "" }));
  };

  const openCreate = () => {
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: s._id || "",
      name: s.name || "",
      isActive: Boolean(s.isActive)
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
    if (!form.name.trim()) e.name = "Sport name is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveSport = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      setError("");
      const payload = {
        name: form.name.trim(),
        isActive: Boolean(form.isActive)
      };
      const res = editMode && form._id
        ? await api.put(`/admin/sports/${form._id}`, payload)
        : await api.post("/admin/sports", payload);
      
      if (res?.data?.success) {
        await loadSports();
        closeModal();
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save sport.");
    } finally {
      setSubmitting(false);
    }
  };

  // const toggleStatus = async (sport) => {
  //   if (!sport?._id) return;
  //   try {
  //     // setActionId(sport._id);
  //     const res = await api.patch(`/admin/sports/${sport._id}/toggle-status`);
  //     if (res?.data?.success) {
  //       setSports(prev => prev.map(s => s._id === sport._id ? { ...s, isActive: !s.isActive } : s));
  //     }
  //   } catch (e) {
  //     setError(e?.response?.data?.message || "Unable to toggle status.");
  //   } finally {
  //     // setActionId("");
  //   }
  // };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/sports/${deleteTarget._id}`);
      setSports(prev => prev.filter(s => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to delete sport.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldCls = "h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100";

  return (
    <div>
      <PageHeader
        title="Sports"
        subtitle="Manage sport categories and their active status."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadSports}
              className="admin-toolbar-btn">
              <RefreshCw size={14} /> Refresh
            </button>
            <button type="button" onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400">
              <Plus size={15} /> Add Sport
            </button>
          </div>
        }
      />

      {error ? (
        <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      ) : null}

      <div className="mb-6">
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sports by name..."
          className="h-11 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100" 
        />
      </div>

      {loading ? (
        <Loader lines={5} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center dark:bg-slate-900">
          <Trophy size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No sports found. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filtered.map((sport, index) => {
            const Icon = iconBySport[sport.slug] || iconBySport.other;

            return (
              <motion.div
                key={sport._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{sport.name}</h3>
                      <p className="text-xs text-slate-400">{sport.matchCount || 0} Matches</p>
                    </div>
                  </div>
                  <span className={`h-2 w-2 rounded-full ${sport.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button 
                    onClick={() => setSelectedSport(sport)}
                    className="admin-action-btn-square h-8 w-8"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    onClick={() => openEdit(sport)}
                    className="admin-action-btn-sm h-8 flex-1"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => setDeleteTarget(sport)}
                    className="admin-action-btn-danger-square h-8 w-8"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {editMode ? "Edit Sport" : "Create Sport"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Define a new sport category for the platform.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              <form onSubmit={saveSport} className="space-y-4">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport Name *</span>
                  <input 
                    value={form.name} 
                    onChange={e => onFormChange("name", e.target.value)} 
                    className={fieldCls} 
                    placeholder="e.g. Cricket" 
                  />
                  {formErrors.name && <span className="mt-1 block text-xs text-rose-500">{formErrors.name}</span>}
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <input 
                    type="checkbox" 
                    checked={form.isActive} 
                    onChange={e => onFormChange("isActive", e.target.checked)} 
                    className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" 
                  />
                  <span className="text-slate-700 dark:text-slate-200">Active / Visible to users</span>
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="admin-secondary-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-70 dark:bg-indigo-500">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Sport"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {selectedSport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sport Details</h2>
                <button type="button" onClick={() => setSelectedSport(null)} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10">
                  {(() => {
                    const Icon = iconBySport[selectedSport.slug] || iconBySport.other;
                    return <Icon size={40} />;
                  })()}
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedSport.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider">{selectedSport.slug}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Total Matches</p>
                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{selectedSport.matchCount || 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Status</p>
                  <p className={`mt-1 text-sm font-bold ${selectedSport.isActive ? "text-emerald-500" : "text-amber-500"}`}>
                    {selectedSport.isActive ? "ACTIVE" : "INACTIVE"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    const s = selectedSport;
                    setSelectedSport(null);
                    openEdit(s);
                  }}
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white dark:bg-indigo-500"
                >
                  Edit Sport
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectedSport(null)}
                  className="admin-secondary-btn flex-1 py-2.5"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this sport?"
        message={`This will permanently remove "${deleteTarget?.name}". This action cannot be undone if the sport has no associated matches.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Sport"}
      />
    </div>
  );
}

export default Sports;
