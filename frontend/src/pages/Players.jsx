import { useEffect, useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Pencil, Plus, RefreshCw, Star, Trash2, UserRound, X } from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import { STATUS_STYLES } from "../utils/constants";
import { getBadgeClass } from "../utils/helpers";

const defaultForm = {
  _id: "",
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

function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [actionPlayerId, setActionPlayerId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/players", { params: { page: 1, limit: 200 } });
      const items = Array.isArray(response?.data?.players) ? response.data.players : [];
      setPlayers(items);
    } catch (apiError) {
      setPlayers([]);
      setError(apiError?.response?.data?.message || "Unable to load players.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const stats = useMemo(() => {
    const active = players.filter((item) => item.status === "active").length;
    const featured = players.filter((item) => item.featured).length;
    return {
      total: players.length,
      active,
      inactive: players.filter((item) => item.status === "inactive").length,
      featured
    };
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return players.filter((item) => {
      const statusOk = statusFilter === "all" ? true : (item.status || "").toLowerCase() === statusFilter;
      const sportOk = sportFilter === "all" ? true : (item.sport || "").toLowerCase() === sportFilter;
      const text = [item.name, item.slug, item.sport, item.team, item.position, item.country, item.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const searchOk = !q || text.includes(q);
      return statusOk && sportOk && searchOk;
    });
  }, [players, search, statusFilter, sportFilter]);

  const sports = useMemo(() => {
    const fixed = ["cricket", "football", "basketball", "tennis", "kabaddi", "other"];
    const dynamic = players.map((item) => (item.sport || "").toLowerCase()).filter(Boolean);
    return Array.from(new Set([...fixed, ...dynamic]));
  }, [players]);

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

  const openEdit = (player) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: player?._id || "",
      name: player?.name || "",
      sport: player?.sport || "cricket",
      team: player?.team || "",
      position: player?.position || "",
      country: player?.country || "",
      bio: player?.bio || "",
      status: player?.status || "active",
      featured: Boolean(player?.featured),
      imageFile: null
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
    if (!form.name?.trim()) nextErrors.name = "Player name is required";
    if (!form.sport?.trim()) nextErrors.sport = "Sport is required";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const savePlayer = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = new FormData();
      payload.append("name", form.name || "");
      payload.append("sport", form.sport || "");
      payload.append("team", form.team || "");
      payload.append("position", form.position || "");
      payload.append("country", form.country || "");
      payload.append("bio", form.bio || "");
      payload.append("status", form.status || "active");
      payload.append("featured", String(Boolean(form.featured)));
      if (form.imageFile) payload.append("image", form.imageFile);

      let response;
      if (editMode && form._id) {
        response = await api.put(`/admin/players/${form._id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        response = await api.post("/admin/players", payload, { headers: { "Content-Type": "multipart/form-data" } });
      }

      const saved = response?.data?.player;
      if (saved?._id) {
        setPlayers((prev) => {
          if (editMode) {
            return prev.map((item) => (item._id === saved._id ? saved : item));
          }
          return [saved, ...prev];
        });
      } else {
        await loadPlayers();
      }

      closeModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save player.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFeatured = async (player) => {
    if (!player?._id) return;

    try {
      setActionPlayerId(player._id);
      setError("");
      const response = await api.patch(`/admin/players/${player._id}/feature`);
      const updated = response?.data?.player;

      if (updated?._id) {
        setPlayers((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        setSelectedPlayer((prev) => (prev?._id === updated._id ? updated : prev));
      } else {
        await loadPlayers();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to update featured state.");
    } finally {
      setActionPlayerId("");
    }
  };

  const openView = async (player) => {
    if (!player?._id) {
      setSelectedPlayer(player || null);
      return;
    }

    try {
      const response = await api.get(`/admin/players/${player._id}`);
      setSelectedPlayer(response?.data?.player || player);
    } catch {
      setSelectedPlayer(player);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleting(true);
      setError("");
      await api.delete(`/admin/players/${deleteTarget._id}`);
      setPlayers((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete player.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Players"
        subtitle="Manage player profiles, featured stars, and roster status."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadPlayers}
              className="admin-toolbar-btn"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={15} /> Add Player
            </button>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-rose-500">{error}</p> : null}

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr)]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, sport, team, country..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Status: All</option>
          <option value="active">Status: Active</option>
          <option value="inactive">Status: Inactive</option>
        </select>
        <select
          value={sportFilter}
          onChange={(event) => setSportFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Sport: All</option>
          {sports.map((item) => (
            <option key={item} value={item}>
              Sport: {item.charAt(0).toUpperCase() + item.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Players</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-500">{stats.active}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Inactive</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.inactive}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Featured</p>
          <p className="mt-2 text-2xl font-semibold text-amber-500">{stats.featured}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            Loading players...
          </div>
        ) : null}

        {!loading && !filteredPlayers.length ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            No players found for this filter.
          </div>
        ) : null}

        {filteredPlayers.map((player, index) => (
          <motion.div
            key={player._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:bg-slate-800">
                  {player.image ? (
                    <img src={player.image} alt={player.name || "Player"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <UserRound size={18} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{player.name || "Unnamed Player"}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {(player.sport || "other").toUpperCase()} - {player.team || "No team"}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs ${getBadgeClass(player.status, STATUS_STYLES)}`}>
                {player.status || "inactive"}
              </span>
            </div>

            <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{player.bio || "No bio added yet."}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleFeatured(player)}
                disabled={actionPlayerId === player._id}
                className="admin-action-btn-warning"
              >
                <Star size={14} className={player.featured ? "fill-current" : ""} />
                {player.featured ? "Featured" : "Feature"}
              </button>
              <button
                type="button"
                onClick={() => openView(player)}
                className="admin-action-btn"
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                onClick={() => openEdit(player)}
                className="admin-action-btn"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(player)}
                className="admin-action-btn-danger"
              >
                <Trash2 size={14} />
              </button>
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
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Player" : "Create Player"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update player details, image, and availability.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={savePlayer} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Player Name</span>
                    <input
                      value={form.name}
                      onChange={(e) => onFormChange("name", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                    {formErrors.name ? <span className="mt-1 block text-xs text-rose-500">{formErrors.name}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport</span>
                    <select
                      value={form.sport}
                      onChange={(e) => onFormChange("sport", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {sports.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    {formErrors.sport ? <span className="mt-1 block text-xs text-rose-500">{formErrors.sport}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Team</span>
                    <input
                      value={form.team}
                      onChange={(e) => onFormChange("team", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Position</span>
                    <input
                      value={form.position}
                      onChange={(e) => onFormChange("position", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Country</span>
                    <input
                      value={form.country}
                      onChange={(e) => onFormChange("country", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Status</span>
                    <select
                      value={form.status}
                      onChange={(e) => onFormChange("status", e.target.value)}
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
                      onChange={(e) => onFormChange("imageFile", e.target.files?.[0] || null)}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Bio</span>
                    <textarea
                      rows="3"
                      value={form.bio}
                      onChange={(e) => onFormChange("bio", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="admin-secondary-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Player"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPlayer ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedPlayer.name || "Unnamed Player"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedPlayer.slug || "No slug"}</p>
                </div>
                <button type="button" onClick={() => setSelectedPlayer(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                {selectedPlayer.image ? (
                  <img src={selectedPlayer.image} alt={selectedPlayer.name || "Player"} className="h-56 w-full object-cover" />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-800">No image</div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p><strong>Sport:</strong> {selectedPlayer.sport || "-"}</p>
                <p><strong>Team:</strong> {selectedPlayer.team || "-"}</p>
                <p><strong>Position:</strong> {selectedPlayer.position || "-"}</p>
                <p><strong>Country:</strong> {selectedPlayer.country || "-"}</p>
                <p><strong>Status:</strong> {selectedPlayer.status || "inactive"}</p>
                <p><strong>Featured:</strong> {selectedPlayer.featured ? "Yes" : "No"}</p>
                <p><strong>Bio:</strong> {selectedPlayer.bio || "-"}</p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this player?"
        message={`This will permanently remove ${deleteTarget?.name || "this player"}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Player"}
      />
    </div>
  );
}

export default Players;
