import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Hash,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X
} from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";

const POSITIONS = [
  { label: "Home Top", value: "home_top" },
  { label: "Home Bottom", value: "home_bottom" },
  { label: "Match Details", value: "match_details" },
  { label: "Live TV Top", value: "livetv_top" }
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

      {loading ? (
        <Loader lines={5} />
      ) : placements.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center dark:bg-slate-900">
          <Megaphone size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No AdMob placements found. Create one to configure ad units.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {placements.map((placement, index) => (
            <motion.div
              key={placement._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${placement.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"}`}>
                      {placement.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      {getFormatLabel(placement.format)}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{placement.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Position: {getPositionLabel(placement.position)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => togglePlacement(placement)}
                    disabled={actionId === placement._id}
                    className="admin-action-btn-square"
                    title={placement.isActive ? "Deactivate" : "Activate"}
                  >
                    {placement.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button type="button" onClick={() => openEdit(placement)} className="admin-action-btn-square" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(placement)} className="admin-action-btn-danger-square" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr),120px]">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400">
                    <Hash size={11} /> Ad Unit ID
                  </p>
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{placement.adUnitId}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Sort Order</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{placement.sortOrder || 0}</p>
                </div>
              </div>

              {placement.notes ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{placement.notes}</p>
              ) : null}
            </motion.div>
          ))}
        </div>
      )}

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
