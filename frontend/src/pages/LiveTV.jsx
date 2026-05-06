import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderKanban, Eye, Pencil, Play, Plus, RefreshCw, Square, Star, Trash2, Tv, X } from "lucide-react";
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
  isPremium: false,
  thumbnailFile: null,
  logoFile: null
};

const defaultCategoryForm = {
  _id: "",
  name: ""
};

const toTitleCase = (value = "") =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

function LiveTV() {
  const [channels, setChannels] = useState([]);
  const [channelCategories, setChannelCategories] = useState([]);
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
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryActionId, setCategoryActionId] = useState("");
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState(null);

  const loadChannels = async () => {
    try {
      setLoading(true);
      setError("");
      const [channelResponse, categoryResponse] = await Promise.all([
        api.get("/admin/channels", { params: { page: 1, limit: 200 } }),
        api.get("/admin/channel-categories")
      ]);

      const items = Array.isArray(channelResponse?.data?.channels) ? channelResponse.data.channels : [];
      setChannels(items);
      setChannelCategories(Array.isArray(categoryResponse?.data?.categories) ? categoryResponse.data.categories : []);
    } catch (apiError) {
      setChannels([]);
      setError(apiError?.response?.data?.message || "Unable to load channels.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const categoryOptions = useMemo(() => {
    const dynamic = channels.map((item) => (item.category || "").toLowerCase()).filter(Boolean);
    const managed = channelCategories.map((item) => item.slug || item.name?.toLowerCase()).filter(Boolean);
    return Array.from(new Set([...managed, ...dynamic]));
  }, [channelCategories, channels]);

  const categoryCards = useMemo(() => {
    const counts = channels.reduce((acc, item) => {
      const key = (item.category || "other").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const managedCards = channelCategories.map((item) => ({
      _id: item._id,
      name: item.name || toTitleCase(item.slug),
      slug: item.slug || item.name?.toLowerCase(),
      count: counts[item.slug] || 0,
      managed: true
    }));

    const managedSlugs = new Set(managedCards.map((item) => item.slug));
    const detectedCards = categoryOptions
      .filter((slug) => !managedSlugs.has(slug))
      .map((slug) => ({
        _id: slug,
        name: toTitleCase(slug),
        slug,
        count: counts[slug] || 0,
        managed: false
      }));

    return [...managedCards, ...detectedCards].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [categoryOptions, channelCategories, channels]);

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
      isPremium: Boolean(channel?.isPremium),
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
      payload.append("isPremium", String(Boolean(form.isPremium)));
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

  const openAddCategory = () => {
    setCategoryForm(defaultCategoryForm);
    setCategoryFormOpen(true);
    setError("");
  };

  const openEditCategory = (category) => {
    if (!category?.managed) return;
    setCategoryForm({
      _id: category._id,
      name: category.name || ""
    });
    setCategoryFormOpen(true);
    setError("");
  };

  const closeCategoryForm = () => {
    setCategoryForm(defaultCategoryForm);
    setCategoryFormOpen(false);
  };

  const saveCategory = async (event) => {
    event.preventDefault();

    if (!categoryForm.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setCategorySubmitting(true);
      setError("");

      const payload = { name: categoryForm.name.trim() };
      const response = categoryForm._id
        ? await api.put(`/admin/channel-categories/${categoryForm._id}`, payload)
        : await api.post("/admin/channel-categories", payload);

      const saved = response?.data?.category;

      if (saved?._id) {
        setChannelCategories((prev) => {
          const next = categoryForm._id
            ? prev.map((item) => (item._id === saved._id ? saved : item))
            : [...prev, saved];

          return next.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        });
        setCategoryFilter(saved.slug || "all");
        setForm((prev) => ({ ...prev, category: saved.slug || prev.category }));
      } else {
        await loadChannels();
      }

      closeCategoryForm();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save category.");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const deleteCategory = async () => {
    if (!categoryDeleteTarget?._id) return;

    try {
      setCategoryActionId(categoryDeleteTarget._id);
      setError("");

      await api.delete(`/admin/channel-categories/${categoryDeleteTarget._id}`);
      setChannelCategories((prev) => prev.filter((item) => item._id !== categoryDeleteTarget._id));

      if (categoryFilter === categoryDeleteTarget.slug) {
        setCategoryFilter("all");
      }
      if (form.category === categoryDeleteTarget.slug) {
        setForm((prev) => ({ ...prev, category: "other" }));
      }

      setCategoryDeleteTarget(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete category.");
    } finally {
      setCategoryActionId("");
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
              className="admin-toolbar-btn"
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
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Status: All</option>
          <option value="live">Status: Live</option>
          <option value="offline">Status: Offline</option>
          <option value="maintenance">Status: Maintenance</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Category: All</option>
          {categoryOptions.map((item) => (
            <option key={item} value={item}>
              Category: {toTitleCase(item)}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white dark:bg-slate-900">
              <FolderKanban size={16} className="text-slate-500" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">Categories</h2>
              <p className="text-xs text-slate-500">Filter and manage live TV categories</p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddCategory}
            className="admin-action-btn-sm"
          >
            <Plus size={12} /> Add category
          </button>
        </div>

        <AnimatePresence>
          {categoryFormOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={saveCategory}
              className="mb-3 flex items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:bg-slate-800"
            >
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Category name..."
                className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              <button type="submit" disabled={categorySubmitting} className="text-xs font-medium text-indigo-500 disabled:opacity-60">
                {categorySubmitting ? "Saving..." : categoryForm._id ? "Update" : "Save"}
              </button>
              <button type="button" onClick={closeCategoryForm} className="text-xs text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs transition ${
              categoryFilter === "all"
                ? "border-green-400 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "border-slate-200 text-slate-600 hover:border-slate-300 dark:text-slate-300"
            }`}
          >
            All
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
              categoryFilter === "all"
                ? "bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-200"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
            >
              {channels.length}
            </span>
          </button>

          {categoryCards.map((category) => (
            <div
              key={category._id}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition ${
                categoryFilter === category.slug
                  ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/30"
                  : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setCategoryFilter(category.slug)}
                className={`flex items-center gap-2 ${
                  categoryFilter === category.slug ? "font-medium text-green-700 dark:text-green-400" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {category.name}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  categoryFilter === category.slug
                    ? "bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-200"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
                >
                  {category.count}
                </span>
              </button>

              {category.managed ? (
                <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5">
                  <button
                    type="button"
                    onClick={() => openEditCategory(category)}
                    className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Edit category"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryDeleteTarget(category)}
                    disabled={categoryActionId === category._id}
                    className="rounded p-0.5 text-slate-400 hover:text-rose-500 disabled:opacity-50"
                    title="Delete category"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
          {[
            { label: "Total", value: stats.total, color: "text-slate-900 dark:text-slate-100" },
            { label: "Live now", value: stats.live, color: "text-rose-500" },
            { label: "Offline", value: stats.offline, color: "text-slate-900 dark:text-slate-100" },
            { label: "Featured", value: stats.featured, color: "text-amber-500" }
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
              <p className={`mt-0.5 text-lg font-medium ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            Loading channels...
          </div>
        ) : null}

        {!loading && !filteredChannels.length ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            No channels found for this filter.
          </div>
        ) : null}

        {filteredChannels.map((channel, index) => (
          <motion.div
            key={channel._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{channel.name || "Untitled Channel"}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {(channel.category || "other").toUpperCase()} - {channel.streamType || "other"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {channel.isPremium && (
                  <span className="inline-flex items-center rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                    ðŸ‘‘ Premium
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-1 text-xs ${getBadgeClass(channel.status, STATUS_STYLES)}`}>
                  {channel.status || "offline"}
                </span>
              </div>
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
                className="admin-action-btn-warning"
              >
                <Star size={14} className={channel.featured ? "fill-current" : ""} />
                {channel.featured ? "Featured" : "Feature"}
              </button>
              <button
                type="button"
                onClick={() => handleWatch(channel)}
                className="admin-action-btn"
              >
                Watch
              </button>
              <button
                type="button"
                onClick={() => openView(channel)}
                className="admin-action-btn"
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                onClick={() => openEdit(channel)}
                className="admin-action-btn"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(channel)}
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
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                    {formErrors.name ? <span className="mt-1 block text-xs text-rose-500">{formErrors.name}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Category</span>
                    <select
                      value={form.category}
                      onChange={(e) => onFormChange("category", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {categoryOptions.map((item) => (
                        <option key={item} value={item}>
                          {toTitleCase(item)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream URL</span>
                    <input
                      value={form.streamUrl}
                      onChange={(e) => onFormChange("streamUrl", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                    {formErrors.streamUrl ? <span className="mt-1 block text-xs text-rose-500">{formErrors.streamUrl}</span> : null}
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Backup URL</span>
                    <input
                      value={form.backupUrl}
                      onChange={(e) => onFormChange("backupUrl", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">RTMP URL</span>
                    <input
                      value={form.rtmpUrl}
                      onChange={(e) => onFormChange("rtmpUrl", e.target.value)}
                      placeholder="rtmp://..."
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">SRT URL</span>
                    <input
                      value={form.srtUrl}
                      onChange={(e) => onFormChange("srtUrl", e.target.value)}
                      placeholder="srt://..."
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Stream Type</span>
                    <select
                      value={form.streamType}
                      onChange={(e) => onFormChange("streamType", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
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
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
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
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
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
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onFormChange("logoFile", e.target.files?.[0] || null)}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
                    <textarea
                      rows="3"
                      value={form.description}
                      onChange={(e) => onFormChange("description", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => onFormChange("featured", e.target.checked)}
                      className="h-4 w-4"
                    />
                    Featured Channel
                  </label>
                  <label className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                    <input
                      type="checkbox"
                      checked={form.isPremium}
                      onChange={(e) => onFormChange("isPremium", e.target.checked)}
                      className="h-4 w-4"
                    />
                    ðŸ‘‘ Premium (subscription required)
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="admin-secondary-btn">
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
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
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
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {selectedChannel.thumbnail ? (
                    <img src={selectedChannel.thumbnail} alt={`${selectedChannel.name || "Channel"} thumbnail`} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-800">No thumbnail</div>
                  )}
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200">
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
                <p><strong>Premium:</strong> {selectedChannel.isPremium ? "ðŸ‘‘ Yes (subscription required)" : "No (free)"}</p>
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

      <ConfirmModal
        open={Boolean(categoryDeleteTarget)}
        title="Delete this category?"
        message={`This will delete ${categoryDeleteTarget?.name || "this category"}. Categories used by channels cannot be removed.`}
        onCancel={() => setCategoryDeleteTarget(null)}
        onConfirm={deleteCategory}
        confirmLabel={categoryActionId ? "Deleting..." : "Delete Category"}
      />

      <WatchModal isOpen={!!watchData} onClose={() => setWatchData(null)} watchData={watchData} />
    </div>
  );
}

export default LiveTV;
