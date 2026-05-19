import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Pencil, Plus, RefreshCw, Shield, ToggleLeft, ToggleRight, Trash2, X, Upload } from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";



const SPORT_COLORS = {
  cricket: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400",
  football: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400",
  basketball: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400",
  kabaddi: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400",
  tennis: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400",
  volleyball: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400",
  other: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400"
};

const defaultForm = {
  _id: "", name: "", slug: "", shortName: "", sport: "",
  country: "", logo: "", isActive: true, sortOrder: "0",
  logoFile: null, logoPreview: ""
};

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [allSports, setAllSports] = useState([]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError("");
      const [teamsRes, sportsRes] = await Promise.all([
        api.get("/admin/teams", { params: { page: 1, limit: 500 } }),
        api.get("/admin/sports").catch(() => ({ data: { sports: [] } }))
      ]);
      setTeams(Array.isArray(teamsRes?.data?.teams) ? teamsRes.data.teams : []);
      setAllSports(Array.isArray(sportsRes?.data?.sports) ? sportsRes.data.sports : []);
    } catch (e) {
      setTeams([]);
      setAllSports([]);
      setError(e?.response?.data?.message || "Unable to load teams.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadTeams(); }, []);

  const stats = useMemo(() => {
    const active = teams.filter(t => t.isActive).length;
    const bySport = {};
    allSports.forEach(s => { bySport[s.slug] = teams.filter(t => t.sport === s.slug).length; });
    return { total: teams.length, active, inactive: teams.length - active, ...bySport };
  }, [teams, allSports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams.filter(t => {
      const sportOk = sportFilter === "all" || t.sport === sportFilter;
      const statusOk = statusFilter === "all" ? true : statusFilter === "active" ? t.isActive : !t.isActive;
      const text = [t.name, t.slug, t.shortName, t.sport, t.country].filter(Boolean).join(" ").toLowerCase();
      return sportOk && statusOk && (!q || text.includes(q));
    });
  }, [teams, search, sportFilter, statusFilter]);

  const onFormChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (formErrors[key]) setFormErrors(p => ({ ...p, [key]: "" }));
  };

  const openCreate = () => {
    setEditMode(false);
    setForm({
      ...defaultForm,
      sport: allSports.length > 0 ? allSports[0].slug : "cricket"
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditMode(true);
    setFormErrors({});
    const validSport = allSports.some(s => s.slug === t.sport) ? t.sport : (allSports[0]?.slug || "");
    setForm({
      _id: t._id || "", name: t.name || "", slug: t.slug || "", shortName: t.shortName || "",
      sport: validSport, country: t.country || "", logo: t.logo || "",
      isActive: Boolean(t.isActive), sortOrder: String(t.sortOrder ?? 0),
      logoFile: null, logoPreview: t.logo || ""
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditMode(false); setForm(defaultForm); setFormErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Team name is required";
    if (!form.sport) e.sport = "Sport is required";
    else if (!allSports.some(s => s.slug === form.sport)) e.sport = "Please choose a valid sport";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveTeam = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      setError("");
      let payload;
      let config = {};

      if (form.logoFile) {
        payload = new FormData();
        payload.append("name", form.name.trim());
        payload.append("slug", form.slug.trim());
        payload.append("shortName", form.shortName.trim());
        payload.append("sport", form.sport);
        payload.append("country", form.country.trim());
        payload.append("isActive", String(Boolean(form.isActive)));
        payload.append("sortOrder", String(Number(form.sortOrder || 0)));
        payload.append("logoFile", form.logoFile);
        config = { headers: { "Content-Type": "multipart/form-data" } };
      } else {
        payload = {
          name: form.name.trim(), slug: form.slug.trim(), shortName: form.shortName.trim(),
          sport: form.sport, country: form.country.trim(), logo: form.logo.trim(),
          isActive: Boolean(form.isActive), sortOrder: Number(form.sortOrder || 0)
        };
      }
      const res = editMode && form._id
        ? await api.put(`/admin/teams/${form._id}`, payload, config)
        : await api.post("/admin/teams", payload, config);
      const saved = res?.data?.team;
      if (saved?._id) {
        setTeams(prev => editMode
          ? prev.map(t => t._id === saved._id ? saved : t)
          : [saved, ...prev]);
      } else { await loadTeams(); }
      closeModal();
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to save team.");
    } finally { setSubmitting(false); }
  };

  const toggleStatus = async (team) => {
    if (!team?._id) return;
    try {
      setActionId(team._id);
      const res = await api.patch(`/admin/teams/${team._id}/toggle-status`);
      const updated = res?.data?.team;
      if (updated?._id) {
        setTeams(prev => prev.map(t => t._id === updated._id ? updated : t));
        setSelectedTeam(prev => prev?._id === updated._id ? updated : prev);
      } else { await loadTeams(); }
    } catch (e) { setError(e?.response?.data?.message || "Unable to toggle status."); }
    finally { setActionId(""); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/teams/${deleteTarget._id}`);
      setTeams(prev => prev.filter(t => t._id !== deleteTarget._id));
      setDeleteTarget(null);
      if (selectedTeam?._id === deleteTarget._id) setSelectedTeam(null);
    } catch (e) { setError(e?.response?.data?.message || "Unable to delete team."); }
    finally { setDeleting(false); }
  };

  const fieldCls = "h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100";

  return (
    <div>
      <PageHeader
        title="Teams"
        subtitle="Manage cricket, football, and other sport teams across the PlayON platform."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadTeams}
              className="admin-toolbar-btn">
              <RefreshCw size={14} /> Refresh
            </button>
            <button type="button" onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400">
              <Plus size={15} /> Add Team
            </button>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-rose-500">{error}</p> : null}

      {/* Filters */}
      <div className="mb-4 grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, short name, country..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100" />
        <select value={sportFilter} onChange={e => setSportFilter(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:bg-slate-900 dark:text-slate-100">
          <option value="all">Sport: All</option>
          {allSports.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none dark:bg-slate-900 dark:text-slate-100">
          <option value="all">Status: All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Teams</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-500">{stats.active}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500">Inactive</p>
          <p className="mt-2 text-2xl font-semibold text-slate-500">{stats.inactive}</p>
        </div>
        <div className="rounded-2xl bg-indigo-50 p-4 shadow-sm dark:bg-indigo-950/30">
          <p className="text-xs uppercase tracking-wide text-indigo-500">By Sport</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {allSports.filter(s => stats[s.slug] > 0).map(s => (
              <span key={s.slug} className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${SPORT_COLORS[s.slug] || SPORT_COLORS.other}`}>
                {s.name} {stats[s.slug]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="rounded-2xl bg-white shadow-sm dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading teams...</div>
        ) : !filtered.length ? (
          <div className="p-10 text-center text-sm text-slate-500">No teams found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-100/70 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Sport / Country</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((team) => (
                  <tr key={team._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {team.logo ? (
                            <img src={team.logo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300"><Shield size={16} /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={team.name}>{team.name}</p>
                          {team.shortName && <p className="text-[10px] text-slate-400 uppercase">{team.shortName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col">
                        <p className={`text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-md inline-block w-fit ${SPORT_COLORS[team.sport] || SPORT_COLORS.other}`}>
                          {team.sport}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">{team.country || "-"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase ${team.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                        {team.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggleStatus(team)} disabled={actionId === team._id} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title={team.isActive ? "Deactivate" : "Activate"}>
                          {team.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <button onClick={() => setSelectedTeam(team)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEdit(team)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(team)} className="admin-action-btn-danger-sm h-8 w-8 rounded-full !p-0" title="Delete">
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


      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 pretty-scroll">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Team" : "Create Team"}</h2>
                  <p className="mt-1 text-sm text-slate-500">Fill in team details — name, sport, country and logo URL.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><X size={18} /></button>
              </div>

              <form onSubmit={saveTeam} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team Name *</span>
                    <input value={form.name} onChange={e => onFormChange("name", e.target.value)} className={fieldCls} placeholder="e.g. Mumbai Indians" />
                    {formErrors.name && <span className="mt-1 block text-xs text-rose-500">{formErrors.name}</span>}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Short Name</span>
                    <input value={form.shortName} onChange={e => onFormChange("shortName", e.target.value)} className={fieldCls} placeholder="e.g. MI" maxLength={10} />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport *</span>
                    <select value={form.sport} onChange={e => onFormChange("sport", e.target.value)} className={fieldCls}>
                      {allSports.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                    </select>
                    {formErrors.sport && <span className="mt-1 block text-xs text-rose-500">{formErrors.sport}</span>}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Country</span>
                    <input value={form.country} onChange={e => onFormChange("country", e.target.value)} className={fieldCls} placeholder="e.g. India" />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Logo</span>
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <input value={form.logo} onChange={e => {
                          onFormChange("logo", e.target.value);
                          if (e.target.value) onFormChange("logoPreview", e.target.value);
                          if (!e.target.value && !form.logoFile) onFormChange("logoPreview", "");
                        }} className={fieldCls} placeholder="Logo URL (e.g. https://...)" disabled={!!form.logoFile} />
                      </div>
                      <span className="text-sm font-medium text-slate-400">OR</span>
                      <div className="relative">
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              setError("Logo image is too large. Max 2MB allowed.");
                              e.target.value = "";
                              return;
                            }
                            setForm(p => ({
                              ...p,
                              logoFile: file,
                              logo: "",
                              logoPreview: URL.createObjectURL(file)
                            }));
                          }
                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                          <Upload size={16} /> Upload from local device
                        </div>
                      </div>
                    </div>
                    {form.logoPreview && (
                      <div className="mt-3 relative inline-block">
                        <img src={form.logoPreview} alt="Preview" className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                        <button type="button" onClick={() => setForm(p => ({...p, logoFile: null, logo: "", logoPreview: ""}))} className="absolute -top-2 -right-2 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 shadow-sm">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Slug</span>
                    <input value={form.slug} onChange={e => onFormChange("slug", e.target.value)} className={fieldCls} placeholder="auto-generated if empty" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sort Order</span>
                    <input type="number" value={form.sortOrder} onChange={e => onFormChange("sortOrder", e.target.value)} className={fieldCls} />
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                    <input type="checkbox" checked={form.isActive} onChange={e => onFormChange("isActive", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" />
                    <span className="text-slate-700 dark:text-slate-200">Team is active</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="admin-secondary-btn">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2 text-sm font-medium text-white disabled:opacity-70">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Team"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Team Details</h2>
                <button type="button" onClick={() => setSelectedTeam(null)} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              <div className="flex items-center gap-4">
                {selectedTeam.logo ? (
                  <img src={selectedTeam.logo} alt={selectedTeam.name} className="h-16 w-16 rounded-2xl border border-slate-200 object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                    <Shield size={28} />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedTeam.name}</h3>
                  {selectedTeam.shortName && <p className="text-sm text-slate-400">{selectedTeam.shortName}</p>}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Sport", value: selectedTeam.sport },
                  { label: "Country", value: selectedTeam.country || "-" },
                  { label: "Status", value: selectedTeam.isActive ? "Active" : "Inactive" },
                  { label: "Sort Order", value: selectedTeam.sortOrder ?? 0 },
                  { label: "Slug", value: selectedTeam.slug || "-" }
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize">{String(value)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => { setSelectedTeam(null); openEdit(selectedTeam); }}
                  className="admin-secondary-btn flex-1">Edit</button>
                <button type="button" onClick={() => { setSelectedTeam(null); setDeleteTarget(selectedTeam); }}
                  className="admin-action-btn-danger flex-1">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this team?"
        message={`This will permanently remove "${deleteTarget?.name || "this team"}".`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Team"}
      />
    </div>
  );
}

export default Teams;
