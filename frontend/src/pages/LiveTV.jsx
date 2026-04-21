import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Pencil, Play, Plus, RefreshCw, Square, Star, Trash2, Tv, X } from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import WatchModal from "../components/WatchModal";
import { STATUS_STYLES } from "../utils/constants";
import { formatNumber, getBadgeClass } from "../utils/helpers";

const defaultForm = {
  _id: "",
  name: "",
  category: "other",
  description: "",
  streamUrl: "",
  backupUrl: "",
  rtmpUrl: "",
  srtUrl: "",
  streamType: "other",
  quality: "auto",
  status: "offline",
  featured: false,
  thumbnailFile: null,
  logoFile: null
};

function LiveTV() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [actionChannelId, setActionChannelId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [watchData, setWatchData] = useState(null);

  const loadChannels = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/channels", { params: { page: 1, limit: 200 } });
      const items = Array.isArray(response?.data?.channels) ? response.data.channels : [];
      setChannels(items);
    } catch (apiError) {
      setChannels([]);
      setError(apiError?.response?.data?.message || "Unable to load channels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const stats = useMemo(() => {
    const live = channels.filter((item) => item.status === "live").length;
    const featured = channels.filter((item) => item.featured).length;
    return {
      total: channels.length,
      live,
      offline: channels.filter((item) => item.status === "offline").length,
      featured
    };
  }, [channels]);

  const filteredChannels = useMemo(() => {
    const q = search.trim().toLowerCase();

    return channels.filter((item) => {
      const statusOk = statusFilter === "all" ? true : (item.status || "").toLowerCase() === statusFilter;
      const categoryOk = categoryFilter === "all" ? true : (item.category || "").toLowerCase() === categoryFilter;
      const text = [
        item.name,
        item.slug,
        item.category,
        item.status,
        item.streamType,
        item.streamUrl,
        item.backupUrl,
        item.rtmpUrl,
        item.srtUrl
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const searchOk = !q || text.includes(q);
      return statusOk && categoryOk && searchOk;
    });
  }, [channels, search, statusFilter, categoryFilter]);

  const categories = useMemo(() => {
    const fixed = ["cricket", "football", "basketball", "tennis", "kabaddi", "news", "multi", "other"];
    const dynamic = channels.map((item) => (item.category || "").toLowerCase()).filter(Boolean);
    return Array.from(new Set([...fixed, ...dynamic]));
  }, [channels]);

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

  const openEdit = (channel) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: channel?._id || "",
      name: channel?.name || "",
      category: channel?.category || "other",
      description: channel?.description || "",
      streamUrl: channel?.streamUrl || "",
      backupUrl: channel?.backupUrl || "",
      rtmpUrl: channel?.rtmpUrl || "",
      srtUrl: channel?.srtUrl || "",
      streamType: channel?.streamType || "other",
      quality: channel?.quality || "auto",
      status: channel?.status || "offline",
      featured: Boolean(channel?.featured),
      thumbnailFile: null,
      logoFile: null
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
    if (!form.name?.trim()) nextErrors.name = "Channel name is required";
    if (!form.streamUrl?.trim()) nextErrors.streamUrl = "Stream URL is required";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveChannel = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = new FormData();
      payload.append("name", form.name || "");
      payload.append("category", form.category || "other");
      payload.append("description", form.description || "");
      payload.append("streamUrl", form.streamUrl || "");
      payload.append("backupUrl", form.backupUrl || "");
      payload.append("rtmpUrl", form.rtmpUrl || "");
      payload.append("srtUrl", form.srtUrl || "");
      payload.append("streamType", form.streamType || "other");
      payload.append("quality", form.quality || "auto");
      payload.append("status", form.status || "offline");
      payload.append("featured", String(Boolean(form.featured)));
      if (form.thumbnailFile) payload.append("thumbnail", form.thumbnailFile);
      if (form.logoFile) payload.append("logo", form.logoFile);

      let response;
      if (editMode && form._id) {
        response = await api.put(`/admin/channels/${form._id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        response = await api.post("/admin/channels", payload, { headers: { "Content-Type": "multipart/form-data" } });
      }

      const saved = response?.data?.channel;
      if (saved?._id) {
        setChannels((prev) => {
          if (editMode) {
            return prev.map((item) => (item._id === saved._id ? saved : item));
          }
          return [saved, ...prev];
        });
      } else {
        await loadChannels();
      }

      closeModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save channel.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLive = async (channel) => {
    if (!channel?._id) return;

    const isLive = channel.status === "live";
    const endpoint = isLive ? `/admin/channels/${channel._id}/offline` : `/admin/channels/${channel._id}/live`;

    try {
      setActionChannelId(channel._id);
      setError("");
      const response = await api.patch(endpoint);
      const updated = response?.data?.channel;

      if (updated?._id) {
        setChannels((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        setSelectedChannel((prev) => (prev?._id === updated._id ? updated : prev));
      } else {
        await loadChannels();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to update live status.");
    } finally {
      setActionChannelId("");
    }
  };

  const toggleFeatured = async (channel) => {
    if (!channel?._id) return;

    try {
      setActionChannelId(channel._id);
      setError("");
      const response = await api.patch(`/admin/channels/${channel._id}/feature`);
      const updated = response?.data?.channel;

      if (updated?._id) {
        setChannels((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        setSelectedChannel((prev) => (prev?._id === updated._id ? updated : prev));
      } else {
        await loadChannels();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to update featured state.");
    } finally {
      setActionChannelId("");
    }
  };

  const openView = async (channel) => {
    if (!channel?._id) {
      setSelectedChannel(channel || null);
      return;
    }

    try {
      const response = await api.get(`/admin/channels/${channel._id}`);
      setSelectedChannel(response?.data?.channel || channel);
    } catch {
      setSelectedChannel(channel);
    }
  };

  const handleWatch = async (channel) => {
    try {
      const response = await api.get(`/admin/channels/${channel._id}/watch`);
      if (response?.data?.success) {
        const stream = response.data.stream || {};

        setWatchData({
          title: response.data.channel?.name || "Live Channel",
          streamUrl: stream.streamUrl || channel.streamUrl,
          streamType: stream.streamType || channel.streamType,
          backupUrl: stream.backupUrl || channel.backupUrl,
          rtmpUrl: stream.rtmpUrl || channel.rtmpUrl,
          srtUrl: stream.srtUrl || channel.srtUrl
        });
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Stream not available");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleting(true);
      setError("");
      await api.delete(`/admin/channels/${deleteTarget._id}`);
      setChannels((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete channel.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Live TV"
        subtitle="Manage TV channels, stream sources, and on-air status."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadChannels}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={15} /> Add Channel
            </button>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-rose-500">{error}</p> : null}

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr)]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by channel, slug, status, stream URL..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Status: All</option>
          <option value="live">Status: Live</option>
          <option value="offline">Status: Offline</option>
          <option value="maintenance">Status: Maintenance</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Category: All</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              Category: {item.charAt(0).toUpperCase() + item.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Channels</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Live Now</p>
          <p className="mt-2 text-2xl font-semibold text-rose-500">{stats.live}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Offline</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.offline}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Featured</p>
          <p className="mt-2 text-2xl font-semibold text-amber-500">{stats.featured}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Loading channels...
          </div>
        ) : null}

        {!loading && !filteredChannels.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            No channels found for this filter.
          </div>
        ) : null}

        {filteredChannels.map((channel, index) => (
          <motion.div
            key={channel._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{channel.name || "Untitled Channel"}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {(channel.category || "other").toUpperCase()} - {channel.streamType || "other"}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs ${getBadgeClass(channel.status, STATUS_STYLES)}`}>
                {channel.status || "offline"}
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              <Tv size={14} className="mr-1 inline" />
              {formatNumber(channel.viewerCount || 0)} viewers
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleLive(channel)}
                disabled={actionChannelId === channel._id}
                className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-sm text-white disabled:opacity-70"
              >
                {channel.status === "live" ? <Square size={14} /> : <Play size={14} />}
                {actionChannelId === channel._id ? "Updating..." : channel.status === "live" ? "Go Offline" : "Go Live"}
              </button>
              <button
                type="button"
                onClick={() => toggleFeatured(channel)}
                disabled={actionChannelId === channel._id}
                className="inline-flex items-center gap-1 rounded-xl border border-amber-300 px-3 py-2 text-sm text-amber-600 disabled:opacity-70"
              >
                <Star size={14} className={channel.featured ? "fill-current" : ""} />
                {channel.featured ? "Featured" : "Feature"}
              </button>
              <button
                type="button"
                onClick={() => handleWatch(channel)}
                className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 px-3 py-2 text-sm text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
              >
                Watch
              </button>
              <button
                type="button"
                onClick={() => openView(channel)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                onClick={() => openEdit(channel)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(channel)}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-300 px-3 py-2 text-sm text-rose-500"
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
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Channel" : "Create Channel"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Configure source URLs, category, quality, and publishing status.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveChannel} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Channel Name</span>
                    <input
                      value={form.name}
                      onChange={(e) => onFormChange("name", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    {formErrors.name ? <span className="mt-1 block text-xs text-rose-500">{formErrors.name}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Category</span>
                    <select
                      value={form.category}
                      onChange={(e) => onFormChange("category", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream URL</span>
                    <input
                      value={form.streamUrl}
                      onChange={(e) => onFormChange("streamUrl", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    {formErrors.streamUrl ? <span className="mt-1 block text-xs text-rose-500">{formErrors.streamUrl}</span> : null}
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Backup URL</span>
                    <input
                      value={form.backupUrl}
                      onChange={(e) => onFormChange("backupUrl", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">RTMP URL</span>
                    <input
                      value={form.rtmpUrl}
                      onChange={(e) => onFormChange("rtmpUrl", e.target.value)}
                      placeholder="rtmp://..."
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">SRT URL</span>
                    <input
                      value={form.srtUrl}
                      onChange={(e) => onFormChange("srtUrl", e.target.value)}
                      placeholder="srt://..."
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream Type</span>
                    <select
                      value={form.streamType}
                      onChange={(e) => onFormChange("streamType", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="hls">hls</option>
                      <option value="youtube">youtube</option>
                      <option value="iframe">iframe</option>
                      <option value="rtmp">rtmp</option>
                      <option value="srt">srt</option>
                      <option value="other">other</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Quality</span>
                    <select
                      value={form.quality}
                      onChange={(e) => onFormChange("quality", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
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
                    <select
                      value={form.status}
                      onChange={(e) => onFormChange("status", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="offline">offline</option>
                      <option value="live">live</option>
                      <option value="maintenance">maintenance</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Thumbnail</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onFormChange("thumbnailFile", e.target.files?.[0] || null)}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onFormChange("logoFile", e.target.files?.[0] || null)}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
                    <textarea
                      rows="3"
                      value={form.description}
                      onChange={(e) => onFormChange("description", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Channel"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedChannel ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedChannel.name || "Untitled Channel"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedChannel.slug || "No slug"}</p>
                </div>
                <button type="button" onClick={() => setSelectedChannel(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  {selectedChannel.thumbnail ? (
                    <img src={selectedChannel.thumbnail} alt={`${selectedChannel.name || "Channel"} thumbnail`} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-800">No thumbnail</div>
                  )}
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  {selectedChannel.logo ? (
                    <img src={selectedChannel.logo} alt={`${selectedChannel.name || "Channel"} logo`} className="h-36 w-full object-contain bg-slate-50 dark:bg-slate-950" />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-800">No logo</div>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p><strong>Category:</strong> {selectedChannel.category || "other"}</p>
                <p><strong>Status:</strong> {selectedChannel.status || "offline"}</p>
                <p><strong>Featured:</strong> {selectedChannel.featured ? "Yes" : "No"}</p>
                <p><strong>Viewers:</strong> {formatNumber(selectedChannel.viewerCount || 0)}</p>
                <p><strong>Type:</strong> {selectedChannel.streamType || "other"}</p>
                <p><strong>Quality:</strong> {selectedChannel.quality || "auto"}</p>
                <p><strong>Stream URL:</strong> {selectedChannel.streamUrl || "-"}</p>
                <p><strong>Backup URL:</strong> {selectedChannel.backupUrl || "-"}</p>
                <p><strong>RTMP URL:</strong> {selectedChannel.rtmpUrl || "-"}</p>
                <p><strong>SRT URL:</strong> {selectedChannel.srtUrl || "-"}</p>
                <p><strong>Description:</strong> {selectedChannel.description || "-"}</p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this channel?"
        message={`This will permanently remove ${deleteTarget?.name || "this channel"}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Channel"}
      />

      <WatchModal isOpen={!!watchData} onClose={() => setWatchData(null)} watchData={watchData} />
    </div>
  );
}

export default LiveTV;
