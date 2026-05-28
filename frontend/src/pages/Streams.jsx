import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Pencil, Play, Plus, RefreshCw, Square, Trash2, X } from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import WatchModal from "../components/WatchModal";
import { STATUS_STYLES } from "../utils/constants";
import { formatNumber, getBadgeClass } from "../utils/helpers";

const defaultForm = {
  _id: "",
  matchId: "",
  title: "",
  provider: "",
  streamUrl: "",
  backupUrl: "",
  streamType: "hls",
  quality: "auto",
  status: "scheduled",
  scheduledAt: "",
  notes: "",
  thumbnailFile: null
};

const asDateTimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function Streams() {
  const [streams, setStreams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [actionStreamId, setActionStreamId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedStream, setSelectedStream] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [watchData, setWatchData] = useState(null);

  const getStreamTitle = (stream) => {
    if (stream.title?.trim()) {
      return stream.title;
    }

    const teamA = stream?.matchId?.teamA?.trim();
    const teamB = stream?.matchId?.teamB?.trim();
    if (teamA || teamB) {
      return `${teamA || "Team A"} vs ${teamB || "Team B"}`;
    }

    return "Untitled Stream";
  };

  const filteredStreams = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return streams;

    return streams.filter((stream) => {
      const text = [
        getStreamTitle(stream),
        stream.provider,
        stream.status,
        stream.streamType,
        stream.streamUrl,
        stream.backupUrl,
        stream.matchId?.title,
        stream.matchId?.teamA,
        stream.matchId?.teamB
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [streams, search]);

  const loadMatches = async () => {
    try {
      const response = await api.get("/admin/matches");
      const apiMatches = Array.isArray(response?.data?.matches) ? response.data.matches : [];
      setMatches(apiMatches);
    } catch {
      setMatches([]);
    }
  };

  const fetchStreams = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/streams", { params: { page: 1, limit: 100 } });
      const apiStreams = Array.isArray(response?.data?.streams) ? response.data.streams : [];
      setStreams(apiStreams);
    } catch (apiError) {
      setStreams([]);
      setError(apiError?.response?.data?.message || "Unable to load streams.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchStreams();
    loadMatches();
  }, []);

  const toggleStream = async (stream) => {
    if (!stream?._id) {
      return;
    }

    const isLive = stream.status === "live";
    const endpoint = isLive ? `/admin/streams/${stream._id}/end` : `/admin/streams/${stream._id}/live`;

    try {
      setActionStreamId(stream._id);
      setError("");

      const response = await api.patch(endpoint);
      const updatedStream = response?.data?.stream;
      if (updatedStream?._id) {
        setStreams((prev) => prev.map((item) => (item._id === updatedStream._id ? updatedStream : item)));
        setSelectedStream((prev) => (prev?._id === updatedStream._id ? updatedStream : prev));
      } else {
        await fetchStreams();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to update stream status.");
    } finally {
      setActionStreamId("");
    }
  };

  const openCreate = () => {
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (stream) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: stream?._id || "",
      matchId: stream?.matchId?._id || stream?.matchId || "",
      title: stream?.title || "",
      provider: stream?.provider || "",
      streamUrl: stream?.streamUrl || "",
      backupUrl: stream?.backupUrl || "",
      streamType: stream?.streamType || "hls",
      quality: stream?.quality || "auto",
      status: stream?.status || "scheduled",
      scheduledAt: asDateTimeLocal(stream?.scheduledAt),
      notes: stream?.notes || "",
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

  const onFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.matchId) nextErrors.matchId = "Match is required";
    if (!form.streamUrl?.trim()) nextErrors.streamUrl = "Stream URL is required";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveStream = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = new FormData();
      payload.append("matchId", form.matchId);
      payload.append("title", form.title || "");
      payload.append("provider", form.provider || "");
      payload.append("streamUrl", form.streamUrl || "");
      payload.append("backupUrl", form.backupUrl || "");
      payload.append("streamType", form.streamType || "hls");
      payload.append("quality", form.quality || "auto");
      payload.append("status", form.status || "scheduled");
      payload.append("notes", form.notes || "");
      if (form.scheduledAt) {
        payload.append("scheduledAt", new Date(form.scheduledAt).toISOString());
      }
      if (form.thumbnailFile) {
        payload.append("thumbnail", form.thumbnailFile);
      }

      let response;
      if (editMode && form._id) {
        response = await api.put(`/admin/streams/${form._id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        response = await api.post("/admin/streams", payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      const saved = response?.data?.stream;
      if (saved?._id) {
        setStreams((prev) => {
          if (editMode) {
            return prev.map((item) => (item._id === saved._id ? saved : item));
          }
          return [saved, ...prev];
        });
      } else {
        await fetchStreams();
      }

      closeModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save stream.");
    } finally {
      setSubmitting(false);
    }
  };

  const openView = async (stream) => {
    try {
      const response = await api.get(`/admin/streams/${stream._id}`);
      setSelectedStream(response?.data?.stream || stream);
    } catch {
      setSelectedStream(stream);
    }
  };

  // const handleWatch = async (stream) => {
  //   try {
  //     const response = await api.get(`/admin/streams/${stream._id}/watch`);
  //     if (response?.data?.success) {
  //       setWatchData({
  //         title: response.data.stream?.title || `Stream: ${response.data.stream?.provider}`,
  //         streamUrl: response.data.stream?.streamUrl,
  //         streamType: response.data.stream?.streamType
  //       });
  //     }
  //   } catch (apiError) {
  //     setError(apiError?.response?.data?.message || "Stream not available");
  //   }
  // };
  const handleWatch = async (stream) => {
    try {
      const response = await api.get(`/admin/streams/${stream._id}/watch`);

      if (response?.data?.success) {
        setWatchData({
          title:
            response.data.stream?.title ||
            `Stream: ${response.data.stream?.provider}`,
          streamUrl: response.data.stream?.streamUrl,
          streamType: response.data.stream?.streamType
        });
      }
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message || "provide Stream url"
      );
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget?._id) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      await api.delete(`/admin/streams/${deleteTarget._id}`);
      setDeleteTarget(null);
      await fetchStreams();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete stream.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Streams"
        subtitle="Control active channels and monitor playback health."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchStreams}
              className="admin-toolbar-btn"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={15} /> Add Stream
            </button>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-rose-500">{error}</p> : null}

      <div className="mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search streams by title, provider, match, team, status..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            Loading streams...
          </div>
        ) : null}

        {!loading && !filteredStreams.length ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            No streams found for your search.
          </div>
        ) : null}

        {filteredStreams.map((stream, index) => (
          <motion.div
            key={stream._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{getStreamTitle(stream)}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quality: {stream.quality}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs ${getBadgeClass(stream.status, STATUS_STYLES)}`}>
                {stream.status}
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(stream.viewerCount || 0)} viewers currently connected</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleStream(stream)}
                disabled={actionStreamId === stream._id}
                className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-sm text-white"
              >
                {stream.status === "live" ? <Square size={14} /> : <Play size={14} />}
                {actionStreamId === stream._id ? "Updating..." : stream.status === "live" ? "Stop" : "Start"}
              </button>
              <button
                type="button"
                onClick={() => handleWatch(stream)}
                className="admin-action-btn"
              >
                Watch
              </button>
              <button
                type="button"
                onClick={() => openView(stream)}
                className="admin-action-btn"
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                onClick={() => openEdit(stream)}
                className="admin-action-btn"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(stream)}
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
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Stream" : "Create Stream"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add stream metadata and connect it to a match.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveStream} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Match</span>
                    <select
                      value={form.matchId}
                      onChange={(e) => onFormChange("matchId", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="">Select match</option>
                      {matches.map((match) => (
                        <option key={match._id} value={match._id}>
                          {match.title || `${match.teamA || "Team A"} vs ${match.teamB || "Team B"}`}
                        </option>
                      ))}
                    </select>
                    {formErrors.matchId ? <span className="mt-1 block text-xs text-rose-500">{formErrors.matchId}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Title</span>
                    <input value={form.title} onChange={(e) => onFormChange("title", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Provider</span>
                    <input value={form.provider} onChange={(e) => onFormChange("provider", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream URL</span>
                    <input value={form.streamUrl} onChange={(e) => onFormChange("streamUrl", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.streamUrl ? <span className="mt-1 block text-xs text-rose-500">{formErrors.streamUrl}</span> : null}
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Backup URL</span>
                    <input value={form.backupUrl} onChange={(e) => onFormChange("backupUrl", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream Type</span>
                    <select value={form.streamType} onChange={(e) => onFormChange("streamType", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                      <option value="hls">hls</option>
                      <option value="youtube">youtube</option>
                      <option value="iframe">iframe</option>
                      <option value="rtmp">rtmp</option>
                      <option value="other">other</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Quality</span>
                    <select value={form.quality} onChange={(e) => onFormChange("quality", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                      <option value="auto">auto</option>
                      <option value="1080p">1080p</option>
                      <option value="720p">720p</option>
                      <option value="480p">480p</option>
                      <option value="360p">360p</option>
                      <option value="240p">240p</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Status</span>
                    <select value={form.status} onChange={(e) => onFormChange("status", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                      <option value="scheduled">scheduled</option>
                      <option value="live">live</option>
                      <option value="offline">offline</option>
                      <option value="ended">ended</option>
                      <option value="failed">failed</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Scheduled At</span>
                    <input type="datetime-local" value={form.scheduledAt} onChange={(e) => onFormChange("scheduledAt", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Thumbnail</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 2 * 1024 * 1024) {
                          setError("Thumbnail is too large. Max 2MB allowed.");
                          e.target.value = "";
                          return;
                        }
                        onFormChange("thumbnailFile", file || null);
                      }}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:text-slate-100"
                    />

                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Notes</span>
                    <textarea rows="3" value={form.notes} onChange={(e) => onFormChange("notes", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="admin-secondary-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Stream"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStream ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{getStreamTitle(selectedStream)}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedStream.provider || "No provider"}</p>
                </div>
                <button type="button" onClick={() => setSelectedStream(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                {selectedStream.thumbnail ? (
                  <img src={selectedStream.thumbnail} alt={getStreamTitle(selectedStream)} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-800">
                    No thumbnail
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p><strong>Status:</strong> {selectedStream.status || "-"}</p>
                <p><strong>Viewers:</strong> {formatNumber(selectedStream.viewerCount || 0)}</p>
                <p><strong>Type:</strong> {selectedStream.streamType || "-"}</p>
                <p><strong>Quality:</strong> {selectedStream.quality || "-"}</p>
                <p><strong>Match:</strong> {selectedStream?.matchId?.title || `${selectedStream?.matchId?.teamA || "-"} vs ${selectedStream?.matchId?.teamB || "-"}`}</p>
                <p><strong>Stream URL:</strong> {selectedStream.streamUrl || "-"}</p>
                <p><strong>Backup URL:</strong> {selectedStream.backupUrl || "-"}</p>
                <p><strong>Scheduled:</strong> {formatDateTime(selectedStream.scheduledAt)}</p>
                <p><strong>Started:</strong> {formatDateTime(selectedStream.startedAt)}</p>
                <p><strong>Ended:</strong> {formatDateTime(selectedStream.endedAt)}</p>
                <p><strong>Notes:</strong> {selectedStream.notes || "-"}</p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this stream?"
        message={`This will permanently remove ${deleteTarget ? getStreamTitle(deleteTarget) : "this stream"}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Stream"}
      />

      <WatchModal isOpen={!!watchData} onClose={() => setWatchData(null)} watchData={watchData} />
    </div>
  );
}

export default Streams;
