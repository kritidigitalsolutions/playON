import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  X,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Image as ImageIcon,
  TicketPercent,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";

const defaultForm = {
  _id: "",
  type: "PROMO",
  title: "",
  description: "",
  promoId: "",
  startDate: "",
  endDate: "",
  isActive: true,
  imageFile: null,
  imagePreview: ""
};

const formatDatetime = (value) => {
  if (!value) return "Always Active";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const toDatetimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

function Popup() {
  const [popups, setPopups] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [selectedPopup, setSelectedPopup] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const loadPopups = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        isActive: statusFilter !== "all" ? (statusFilter === "active" ? "true" : "false") : undefined
      };

      const res = await api.get("/admin/popups", { params });
      
      if (res?.data?.success) {
        setPopups(Array.isArray(res.data.popups) ? res.data.popups : []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch (e) {
      setPopups([]);
      setError(e?.response?.data?.message || "Unable to load popups.");
    } finally {
      setLoading(false);
    }
  };

  const loadPromos = async () => {
    try {
      const res = await api.get("/admin/promos");
      if (res?.data?.success) {
        // Filter only active promos
        const activePromos = (res.data.promos || []).filter((p) => p.isActive);
        setPromos(activePromos);
      }
    } catch (e) {
      console.error("Failed to load promo codes", e);
    }
  };

  useEffect(() => {
    loadPopups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, statusFilter]);

  // Handle manual trigger for search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadPopups();
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const onFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({ ...prev, image: "Image is too large. Max 5MB allowed." }));
        e.target.value = "";
        return;
      }
      setForm((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
      if (formErrors.image) {
        setFormErrors((prev) => ({ ...prev, image: "" }));
      }
    }
  };

  const openCreate = () => {
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (popup) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: popup._id || "",
      type: popup.type || "PROMO",
      title: popup.title || "",
      description: popup.description || "",
      promoId: popup.promo?.promoId?._id || popup.promo?.promoId || "",
      startDate: toDatetimeLocalValue(popup.startDate),
      endDate: toDatetimeLocalValue(popup.endDate),
      isActive: Boolean(popup.isActive),
      imageFile: null,
      imagePreview: popup.image || ""
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
    if (!form.type) e.type = "Type is required";
    
    if (form.type === "PROMO") {
      if (!form.title.trim()) e.title = "Title is required";
      if (!form.description.trim()) e.description = "Description is required";
      if (!form.promoId) e.promoId = "Coupon code selection is required";
    }

    if (form.type === "IMAGE") {
      if (!editMode && !form.imageFile) {
        e.image = "Image is required";
      }
    }

    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end < start) {
        e.endDate = "End date must be greater than or equal to start date";
      }
    }

    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const savePopup = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append("type", form.type);
      formData.append("isActive", form.isActive);
      formData.append("startDate", form.startDate || "");
      formData.append("endDate", form.endDate || "");

      if (form.type === "PROMO") {
        formData.append("title", form.title.trim());
        formData.append("description", form.description.trim());
        formData.append("promoId", form.promoId);
      } else if (form.type === "IMAGE") {
        if (form.imageFile) {
          formData.append("image", form.imageFile);
        }
      }

      let res;
      if (editMode && form._id) {
        res = await api.put(`/admin/popups/${form._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        res = await api.post("/admin/popups", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (res?.data?.success) {
        await loadPopups();
        closeModal();
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save popup configuration.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/admin/popups/${deleteTarget._id}`);
      if (res?.data?.success) {
        await loadPopups();
        setDeleteTarget(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete popup.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (popup) => {
    try {
      setError("");
      const res = await api.put(`/admin/popups/${popup._id}`, {
        isActive: !popup.isActive
      });

      if (res?.data?.success) {
        await loadPopups();
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to toggle popup status.");
    }
  };

  const isScheduledActive = (popup) => {
    if (!popup.isActive) return false;
    if (!popup.startDate && !popup.endDate) return true;
    const now = new Date();
    const start = popup.startDate ? new Date(popup.startDate) : null;
    const end = popup.endDate ? new Date(popup.endDate) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  const fieldCls = "h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Popup Announcements"
        subtitle="Manage popup banners displaying promo codes or custom images to users when launching the app."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadPopups}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={15} /> Add Popup
            </button>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Toolbar / Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px] max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 pl-4 pr-20 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Type</span>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
            >
              <option value="all">All Types</option>
              <option value="PROMO">Promo</option>
              <option value="IMAGE">Image</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <section className="rounded-2xl bg-white shadow-sm dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-500">
            <div className="flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-indigo-500" />
              <span>Loading popups...</span>
            </div>
          </div>
        ) : popups.length === 0 ? (
          <div className="p-16 text-center text-sm text-slate-500">
            No popup configurations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-100/70 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-3.5 font-medium">Type</th>
                  <th className="px-4 py-3.5 font-medium">Details / Preview</th>
                  <th className="px-4 py-3.5 font-medium">Active Status</th>
                  <th className="px-4 py-3.5 font-medium">Date Schedule</th>
                  <th className="px-4 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {popups.map((popup) => {
                  const isScheduled = isScheduledActive(popup);
                  return (
                    <tr key={popup._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                          popup.type === "PROMO"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}>
                          {popup.type === "PROMO" ? <TicketPercent size={12} /> : <ImageIcon size={12} />}
                          {popup.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {popup.type === "PROMO" ? (
                          <div className="min-w-0 max-w-sm">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={popup.title}>{popup.title}</p>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5" title={popup.description}>{popup.description}</p>
                            {popup.promo?.code && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                  CODE: {popup.promo.code}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({popup.promo.discountType === "flat" ? "₹" : ""}{popup.promo.discountValue}{popup.promo.discountType === "percent" ? "%" : ""} Off)
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {popup.image ? (
                                <img src={popup.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon size={16} /></div>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={popup.image}>
                              {popup.image ? popup.image.split("/").pop().slice(-20) : "No image uploaded"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleStatus(popup)}
                            className={`transition-colors duration-200 ${
                              popup.isActive ? "text-indigo-500 hover:text-indigo-600" : "text-slate-400 hover:text-slate-500"
                            }`}
                            title={popup.isActive ? "Deactivate" : "Activate"}
                          >
                            {popup.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                          </button>
                          
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              popup.isActive
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {popup.isActive ? "Enabled" : "Disabled"}
                            </span>
                            
                            {popup.isActive && (
                              <span className={`text-[10px] font-medium ${isScheduled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                                {isScheduled ? "• Live Now" : "• Scheduled"}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>Start: {formatDatetime(popup.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>End: {formatDatetime(popup.endDate)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedPopup(popup)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(popup)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(popup)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-950/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Total {total} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* View Modal */}
      <AnimatePresence>
        {selectedPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
            >
              <div className="p-5 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Popup Details</h3>
                <button onClick={() => setSelectedPopup(null)} className="text-slate-500 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {selectedPopup.type === "IMAGE" ? (
                  <div className="space-y-4">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800">
                      {selectedPopup.image ? (
                        <img src={selectedPopup.image} alt="Announcement" className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">No Image</div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">Image URL</p>
                      <a href={selectedPopup.image} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 truncate block mt-0.5 hover:underline">
                        {selectedPopup.image}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Promo Announcement</p>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 mt-2 text-lg">{selectedPopup.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">{selectedPopup.description}</p>
                    </div>

                    {selectedPopup.promo && (
                      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                        <div>
                          <p className="text-xs font-medium text-slate-400">Coupon Code</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 uppercase">{selectedPopup.promo.code || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400">Discount</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {selectedPopup.promo.discountType === "flat" ? "₹" : ""}{selectedPopup.promo.discountValue}{selectedPopup.promo.discountType === "percent" ? "%" : ""} Off
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-slate-400">Status</span>
                    <span className={`inline-block font-semibold mt-1 ${selectedPopup.isActive ? "text-emerald-500" : "text-slate-400"}`}>
                      {selectedPopup.isActive ? "Active / Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Scheduled Status</span>
                    <span className={`inline-block font-semibold mt-1 ${isScheduledActive(selectedPopup) ? "text-emerald-500" : "text-amber-500"}`}>
                      {isScheduledActive(selectedPopup) ? "Live Now" : "Outside active date range"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Start Date</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 mt-1 block">
                      {formatDatetime(selectedPopup.startDate)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400">End Date</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 mt-1 block">
                      {formatDatetime(selectedPopup.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
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
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 pretty-scroll"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {editMode ? "Edit Popup Announcement" : "Create New Popup"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editMode ? "Modify popup announcement criteria." : "Configure a new app start-up popup banner."}
                  </p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
              </div>

              <form onSubmit={savePopup} className="space-y-4">
                <div>
                  <span className="mb-1 block text-sm text-slate-500 dark:text-slate-400">Popup Type</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onFormChange("type", "PROMO")}
                      className={`flex-1 h-11 rounded-xl font-medium text-sm transition-all border ${
                        form.type === "PROMO"
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-indigo-500 dark:border-indigo-500"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      Promo Announcement
                    </button>
                    <button
                      type="button"
                      onClick={() => onFormChange("type", "IMAGE")}
                      className={`flex-1 h-11 rounded-xl font-medium text-sm transition-all border ${
                        form.type === "IMAGE"
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-indigo-500 dark:border-indigo-500"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      Image Banner
                    </button>
                  </div>
                </div>

                {form.type === "PROMO" && (
                  <>
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-500 dark:text-slate-400">Promo Code Selection *</span>
                      <select
                        value={form.promoId}
                        onChange={(e) => onFormChange("promoId", e.target.value)}
                        className={fieldCls}
                      >
                        <option value="">-- Choose Active Promo Code --</option>
                        {promos.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.code} ({p.discountType === "flat" ? "₹" : ""}{p.discountValue}{p.discountType === "percent" ? "%" : ""} Off)
                          </option>
                        ))}
                      </select>
                      {formErrors.promoId && <span className="mt-1 block text-xs text-rose-500">{formErrors.promoId}</span>}
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-500 dark:text-slate-400">Announcement Title *</span>
                      <input
                        value={form.title}
                        onChange={(e) => onFormChange("title", e.target.value)}
                        className={fieldCls}
                        placeholder="e.g. Special Discount Just for You!"
                      />
                      {formErrors.title && <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span>}
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-500 dark:text-slate-400">Description *</span>
                      <textarea
                        value={form.description}
                        onChange={(e) => onFormChange("description", e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                        placeholder="Provide details about this discount offer..."
                      />
                      {formErrors.description && <span className="mt-1 block text-xs text-rose-500">{formErrors.description}</span>}
                    </label>
                  </>
                )}

                {form.type === "IMAGE" && (
                  <div className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Popup Banner Image {editMode ? "(Leave empty to keep current)" : "*"}</span>
                    <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-indigo-400 dark:bg-slate-950 dark:border-slate-800">
                      {form.imagePreview ? (
                        <>
                          <img src={form.imagePreview} alt="Preview" className="h-full w-full object-contain" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-100">
                              Replace Image
                              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                          <ImageIcon size={32} className="mb-2 text-slate-300" />
                          <label className="cursor-pointer font-medium text-indigo-500 hover:text-indigo-600">
                            Upload an image file
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          </label>
                          <span className="mt-1 text-xs text-slate-400">Supports PNG, JPG, GIF up to 5MB</span>
                        </div>
                      )}
                    </div>
                    {formErrors.image && <span className="mt-1 block text-xs text-rose-500">{formErrors.image}</span>}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Start Date / Time</span>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => onFormChange("startDate", e.target.value)}
                      className={fieldCls}
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">End Date / Time</span>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => onFormChange("endDate", e.target.value)}
                      className={fieldCls}
                    />
                    {formErrors.endDate && <span className="mt-1 block text-xs text-rose-500">{formErrors.endDate}</span>}
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => onFormChange("isActive", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                  />
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Popup is active / enabled</span>
                </label>

                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950 text-xs text-slate-500 leading-relaxed">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">💡 Important Configuration Rules:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Only **one active popup** is allowed by the platform. Activating this popup will automatically disable other active popups.</li>
                    <li>If dates are left empty, the popup will be active continuously.</li>
                    <li>To schedule, define both Start and End Dates. The popup will only show to users inside this window.</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-75 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Popup"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete popup configuration?"
        message="This will permanently delete this popup configuration. This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Popup"}
      />
    </div>
  );
}

export default Popup;
