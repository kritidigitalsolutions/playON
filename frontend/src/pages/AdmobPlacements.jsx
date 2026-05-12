import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  // Hash,
  // Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Eye
} from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
// import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";

const POSITIONS = [
  { label: "Home Top", value: "home_top" },
  { label: "Home Bottom", value: "home_bottom" },
  { label: "Match Details", value: "match_details" },
  { label: "Live TV Top", value: "livetv_top" },
  { label: "Event Top", value: "event_top" },
  { label: "Series Top", value: "series_top" },
  { label: "Highlights Top", value: "highlights_top" },
  { label: "Profile Top", value: "profile_top" },
  { label: "Podcast", value: "podcast" },
  { label: "Star Players", value: "star_players" }
];

const FORMATS = [
  { label: "Banner", value: "banner" },
  { label: "Adaptive Banner", value: "adaptive_banner" },
  { label: "Interstitial", value: "interstitial" },
  { label: "Rewarded", value: "rewarded" },
  { label: "Native", value: "native" }
];

const defaultForm = {
  _id: "",
  title: "",
  position: "home_top",
  adUnitId: "",
  format: "banner",
  sortOrder: 0,
  isActive: true,
  notes: ""
};

const getPositionLabel = (value) =>
  POSITIONS.find((position) => position.value === value)?.label || value || "-";

const getFormatLabel = (value) =>
  FORMATS.find((format) => format.value === value)?.label || value || "-";

function AdmobPlacements() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);

  const loadPlacements = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/admob-placements");
      setPlacements(Array.isArray(response?.data?.placements) ? response.data.placements : []);
    } catch (apiError) {
      setPlacements([]);
      setError(apiError?.response?.data?.message || "Unable to load AdMob placements.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadPlacements();
  }, []);

  const stats = useMemo(() => {
    const active = placements.filter((placement) => placement.isActive).length;
    const positions = new Set(placements.map((placement) => placement.position).filter(Boolean)).size;

    return {
      total: placements.length,
      active,
      inactive: placements.length - active,
      positions
    };
  }, [placements]);

  const updateForm = (key, value) => {
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

  const openEdit = (placement) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: placement?._id || "",
      title: placement?.title || "",
      position: placement?.position || "home_top",
      adUnitId: placement?.adUnitId || "",
      format: placement?.format || "banner",
      sortOrder: placement?.sortOrder || 0,
      isActive: Boolean(placement?.isActive),
      notes: placement?.notes || ""
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

    if (!form.title.trim()) nextErrors.title = "Title is required";
    if (!form.adUnitId.trim()) nextErrors.adUnitId = "Ad unit ID is required";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const savePlacement = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        position: form.position,
        adUnitId: form.adUnitId.trim(),
        format: form.format,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        notes: form.notes.trim()
      };

      const response = editMode && form._id
        ? await api.put(`/admin/admob-placements/${form._id}`, payload)
        : await api.post("/admin/admob-placements", payload);

      const saved = response?.data?.placement;

      if (saved?._id) {
        setPlacements((prev) => editMode
          ? prev.map((item) => (item._id === saved._id ? saved : item))
          : [saved, ...prev]
        );
      } else {
        await loadPlacements();
      }

      closeModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save AdMob placement.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePlacement = async (placement) => {
    if (!placement?._id) return;

    try {
      setActionId(placement._id);
      setError("");

      const response = await api.patch(`/admin/admob-placements/${placement._id}/toggle`);
      const updated = response?.data?.placement;

      if (updated?._id) {
        setPlacements((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      } else {
        await loadPlacements();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to update AdMob placement status.");
    } finally {
      setActionId("");
    }
  };

  const deletePlacement = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleting(true);
      setError("");

      await api.delete(`/admin/admob-placements/${deleteTarget._id}`);
      setPlacements((prev) => prev.filter((placement) => placement._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete AdMob placement.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldClass = "h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100";

  return (
    <div>
      <PageHeader
        title="AdMob Placements"
        subtitle="Set AdMob ad unit IDs and choose where they appear in the app."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadPlacements} className="admin-toolbar-btn">
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={15} /> Add Placement
            </button>
          </div>
        }
      />

      {error ? (
        <div className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Placements</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-500">{stats.active}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Inactive</p>
          <p className="mt-2 text-2xl font-semibold text-slate-500">{stats.inactive}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Positions Used</p>
          <p className="mt-2 text-2xl font-semibold text-indigo-500">{stats.positions}</p>
        </div>
      </div>

      <section className="rounded-2xl bg-white shadow-sm dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading placements...</div>
        ) : placements.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No placements found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-100/70 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Placement / Title</th>
                  <th className="px-4 py-3 font-medium">Position / Format</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {placements.map((placement) => (
                  <tr key={placement._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{placement.title}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[250px] font-mono">{placement.adUnitId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400">
                          {getPositionLabel(placement.position)}
                        </p>
                        <p className="mt-1 text-[10px] text-indigo-500 font-bold uppercase">{getFormatLabel(placement.format)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase ${placement.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                        {placement.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedPlacement(placement)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="View Details">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => togglePlacement(placement)} disabled={actionId === placement._id} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title={placement.isActive ? "Deactivate" : "Activate"}>
                          {placement.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <button onClick={() => openEdit(placement)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(placement)} className="admin-action-btn-danger-sm h-8 w-8 rounded-full !p-0" title="Delete">
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 pretty-scroll"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {editMode ? "Edit AdMob Placement" : "Create AdMob Placement"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add an AdMob unit ID and choose the display position.
                  </p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={savePlacement} className="space-y-4">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Placement Title *</span>
                  <input
                    value={form.title}
                    onChange={(event) => updateForm("title", event.target.value)}
                    className={fieldClass}
                    placeholder="e.g. Home Screen Banner"
                  />
                  {formErrors.title ? <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span> : null}
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Ad Unit ID *</span>
                  <input
                    value={form.adUnitId}
                    onChange={(event) => updateForm("adUnitId", event.target.value)}
                    className={fieldClass}
                    placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                  />
                  {formErrors.adUnitId ? <span className="mt-1 block text-xs text-rose-500">{formErrors.adUnitId}</span> : null}
                </label>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-sm md:col-span-1">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Display Position</span>
                    <select
                      value={form.position}
                      onChange={(event) => updateForm("position", event.target.value)}
                      className={fieldClass}
                    >
                      {POSITIONS.map((position) => (
                        <option key={position.value} value={position.value}>{position.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm md:col-span-1">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Ad Format</span>
                    <select
                      value={form.format}
                      onChange={(event) => updateForm("format", event.target.value)}
                      className={fieldClass}
                    >
                      {FORMATS.map((format) => (
                        <option key={format.value} value={format.value}>{format.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sort Order</span>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(event) => updateForm("sortOrder", event.target.value)}
                      className={fieldClass}
                    />
                  </label>
                </div>

                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Notes</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => updateForm("notes", event.target.value)}
                    className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="Optional placement notes"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => updateForm("isActive", event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                  />
                  <span className="text-slate-700 dark:text-slate-200">Placement is active</span>
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="admin-secondary-btn">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-70 dark:bg-indigo-500"
                  >
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Placement"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {selectedPlacement && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AdMob Placement Details</h2>
                <button type="button" onClick={() => setSelectedPlacement(null)} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              <div className="mb-5">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate" title={selectedPlacement.title}>{selectedPlacement.title}</h3>
                <p className="text-sm font-mono text-slate-500 mt-1 truncate p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 select-all">{selectedPlacement.adUnitId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Position", value: getPositionLabel(selectedPlacement.position) },
                  { label: "Format", value: getFormatLabel(selectedPlacement.format) },
                  { label: "Status", value: selectedPlacement.isActive ? "Active" : "Inactive" },
                  { label: "Sort Order", value: selectedPlacement.sortOrder || 0 }
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize">{String(value)}</p>
                  </div>
                ))}
                
                {selectedPlacement.notes && (
                  <div className="col-span-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                     <p className="text-[10px] uppercase tracking-wide text-slate-400">Notes</p>
                     <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-3">{selectedPlacement.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => { setSelectedPlacement(null); openEdit(selectedPlacement); }}
                  className="admin-secondary-btn flex-1">Edit</button>
                <button type="button" onClick={() => { setSelectedPlacement(null); setDeleteTarget(selectedPlacement); }}
                  className="admin-action-btn-danger flex-1">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this AdMob placement?"
        message={`This will permanently remove "${deleteTarget?.title || "this placement"}".`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deletePlacement}
        confirmLabel={deleting ? "Deleting..." : "Delete Placement"}
      />
    </div>
  );
}

export default AdmobPlacements;
