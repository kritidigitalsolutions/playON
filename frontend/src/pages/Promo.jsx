import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Pencil, Plus, RefreshCw, TicketPercent, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";

const defaultForm = {
  _id: "",
  code: "",
  title: "",
  discountType: "percent",
  discountValue: "",
  minAmount: "0",
  maxDiscount: "0",
  usageLimit: "0",
  perUserLimit: "1",
  validFrom: "",
  validTill: "",
  isActive: true,
  isReferral: false,
  applicablePlans: []
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const toDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const formatDiscount = (promo) => {
  const value = Number(promo?.discountValue || 0);
  return promo?.discountType === "flat" ? `₹${value}` : `${value}%`;
};

function Promo() {
  const [promos, setPromos] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeReferrals, setActiveReferrals] = useState([]);

  const loadPromos = async () => {
    try {
      setLoading(true);
      setError("");

      const [promoResponse, planResponse] = await Promise.all([
        api.get("/admin/promos"),
        api.get("/admin/plans", { params: { page: 1, limit: 200 } })
      ]);

      setPromos(Array.isArray(promoResponse?.data?.promos) ? promoResponse.data.promos : []);
      setPlans(Array.isArray(planResponse?.data?.plans) ? planResponse.data.plans : []);
    } catch (apiError) {
      setPromos([]);
      setError(apiError?.response?.data?.message || "Unable to load promo codes.");
    } finally {
      setLoading(false);
    }
  };

  const loadActiveReferral = async () => {
    try {
      const response = await api.get("/user/referral-offer");
      setActiveReferrals(Array.isArray(response?.data?.offers) ? response.data.offers : []);
    } catch (err) {
      console.error("Failed to load active referral:", err);
    }
  };

  useEffect(() => {
    loadPromos();
    loadActiveReferral();
  }, []);

  const stats = useMemo(() => {
    const active = promos.filter((item) => item.isActive).length;
    const percent = promos.filter((item) => item.discountType === "percent").length;

    return {
      total: promos.length,
      active,
      inactive: promos.length - active,
      percent,
      flat: promos.length - percent
    };
  }, [promos]);

  const filteredPromos = useMemo(() => {
    const query = search.trim().toLowerCase();

    return promos.filter((item) => {
      let statusOk = true;
      if (statusFilter === "active") statusOk = item.isActive;
      else if (statusFilter === "inactive") statusOk = !item.isActive;
      else if (statusFilter === "referral") statusOk = item.isReferral;

      const haystack = [
        item.code,
        item.title,
        item.discountType,
        ...(item.applicablePlans || []).map((plan) => plan?.title || plan?.slug || "")
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return statusOk && (!query || haystack.includes(query));
    });
  }, [promos, search, statusFilter]);

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

  const openEdit = (promo) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: promo?._id || "",
      code: promo?.code || "",
      title: promo?.title || "",
      discountType: promo?.discountType || "percent",
      discountValue: String(promo?.discountValue ?? ""),
      minAmount: String(promo?.minAmount ?? 0),
      maxDiscount: String(promo?.maxDiscount ?? 0),
      usageLimit: String(promo?.usageLimit ?? 0),
      perUserLimit: String(promo?.perUserLimit ?? 1),
      validFrom: toDateInputValue(promo?.validFrom),
      validTill: toDateInputValue(promo?.validTill),
      isActive: Boolean(promo?.isActive),
      isReferral: Boolean(promo?.isReferral),
      applicablePlans: (promo?.applicablePlans || []).map((plan) => plan?._id || plan).filter(Boolean)
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

    if (!form.code.trim()) nextErrors.code = "Promo code is required";
    if (!form.discountType) nextErrors.discountType = "Select discount type";
    if (form.discountValue === "" || Number(form.discountValue) <= 0) {
      nextErrors.discountValue = "Discount value must be greater than 0";
    }
    if (form.discountType === "percent" && Number(form.discountValue) > 100) {
      nextErrors.discountValue = "Percent discount cannot exceed 100";
    }
    if (Number(form.minAmount) < 0) nextErrors.minAmount = "Minimum amount cannot be negative";
    if (Number(form.maxDiscount) < 0) nextErrors.maxDiscount = "Maximum discount cannot be negative";
    if (Number(form.usageLimit) < 0) nextErrors.usageLimit = "Usage limit cannot be negative";
    if (Number(form.perUserLimit) < 1) nextErrors.perUserLimit = "Per user limit must be at least 1";
    if (form.validFrom && form.validTill && new Date(form.validFrom) > new Date(form.validTill)) {
      nextErrors.validTill = "Valid till must be after valid from";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const savePromo = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minAmount: Number(form.minAmount || 0),
        maxDiscount: Number(form.maxDiscount || 0),
        usageLimit: Number(form.usageLimit || 0),
        perUserLimit: Number(form.perUserLimit || 1),
        validFrom: form.validFrom || null,
        validTill: form.validTill || null,
        isActive: Boolean(form.isActive),
        isReferral: Boolean(form.isReferral),
        applicablePlans: form.applicablePlans
      };

      const response = editMode && form._id
        ? await api.patch(`/admin/promos/${form._id}`, payload)
        : await api.post("/admin/promos", payload);

      const saved = response?.data?.promo;

      if (saved?._id) {
        setPromos((prev) => (editMode ? prev.map((item) => (item._id === saved._id ? saved : item)) : [saved, ...prev]));
      } else {
        await loadPromos();
      }

      await loadActiveReferral();
      closeModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save promo code.");
    } finally {
      setSubmitting(false);
    }
  };

  const openView = async (promo) => {
    if (!promo?._id) {
      setSelectedPromo(promo || null);
      return;
    }

    try {
      const response = await api.get(`/admin/promos/${promo._id}`);
      setSelectedPromo(response?.data?.promo || promo);
    } catch {
      setSelectedPromo(promo);
    }
  };

  const toggleStatus = async (promo) => {
    if (!promo?._id) return;

    try {
      setActionId(promo._id);
      setError("");

      const response = await api.patch(`/admin/promos/${promo._id}/toggle`);
      const updated = response?.data?.promo;

      if (updated?._id) {
        setPromos((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        setSelectedPromo((prev) => (prev?._id === updated._id ? updated : prev));
      } else {
        await loadPromos();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to update promo status.");
    } finally {
      setActionId("");
    }
  };

  const deletePromo = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleting(true);
      setError("");

      await api.delete(`/admin/promos/${deleteTarget._id}`);
      setPromos((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setSelectedPromo((prev) => (prev?._id === deleteTarget._id ? null : prev));
      setDeleteTarget(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete promo code.");
    } finally {
      setDeleting(false);
    }
  };

  const togglePlanSelection = (planId) => {
    setForm((prev) => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(planId)
        ? prev.applicablePlans.filter((id) => id !== planId)
        : [...prev.applicablePlans, planId]
    }));
  };

  const columns = [
    {
      key: "code",
      label: "Promo",
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{row.code}</p>
            {row.isReferral && (
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                Referral
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.title || "No title"}</p>
        </div>
      )
    },
    {
      key: "discount",
      label: "Discount",
      render: (row) => (
        <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-500">
          {formatDiscount(row)}
        </span>
      )
    },
    {
      key: "limits",
      label: "Limits",
      render: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          Used {row.usedCount || 0} / {row.usageLimit || "Unlimited"}
        </span>
      )
    },
    { key: "validTill", label: "Valid Till", render: (row) => formatDate(row.validTill) },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs ${
          row.isActive
            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            : "border border-slate-500/20 bg-slate-500/10 text-slate-500"
        }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleStatus(row)}
            disabled={actionId === row._id}
            className="admin-action-btn-sm"
          >
            {row.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
          </button>
          <button type="button" onClick={() => openView(row)} className="admin-action-btn-sm">
            <Eye size={13} />
          </button>
          <button type="button" onClick={() => openEdit(row)} className="admin-action-btn-sm">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={() => setDeleteTarget(row)} className="admin-action-btn-danger-sm">
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Promo Codes"
        subtitle="Create, update, and track discount codes for subscription purchases."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadPromos}
              className="admin-toolbar-btn"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={15} /> Add Promo
            </button>
          </div>
        }
      />

      {error ? <p className="mb-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p> : null}

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr),200px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by code, title, plan..."
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
          <option value="referral">Type: Referral Offers</option>
        </select>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Promos</p>
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
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Discount Types</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{stats.percent} percent / {stats.flat} flat</p>
        </div>
      </div>

      {activeReferrals.length > 0 && (
        <div className="mb-6 space-y-3">
          {activeReferrals.map((offer) => (
            <div key={offer._id} className="overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 dark:bg-amber-500/10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                    <TicketPercent size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Live Referral Offer</p>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {offer.title} ({offer.discountType === "percent" ? `${offer.discountValue}%` : `₹${offer.discountValue}`})
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Public Endpoint</p>
                  <code className="text-[11px] font-medium text-amber-700 dark:text-amber-400">/api/user/referral-offer</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
          Loading promo codes...
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredPromos}
          rowKey="_id"
          emptyTitle="No promo codes"
          emptyMessage="Create a promo code to start offering discounts."
        />
      )}

      <AnimatePresence>
        {modalOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Promo" : "Create Promo"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Set discount rules, usage limits, validity, and applicable plans.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={savePromo} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Code</span>
                    <input value={form.code} onChange={(event) => onFormChange("code", event.target.value.toUpperCase())} className="h-11 w-full rounded-xl border border-slate-200 px-3 uppercase outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.code ? <span className="mt-1 block text-xs text-rose-500">{formErrors.code}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Title</span>
                    <input value={form.title} onChange={(event) => onFormChange("title", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Discount Type</span>
                    <select value={form.discountType} onChange={(event) => onFormChange("discountType", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                      <option value="percent">Percent</option>
                      <option value="flat">Flat</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Discount Value</span>
                    <input type="number" min="1" value={form.discountValue} onChange={(event) => onFormChange("discountValue", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.discountValue ? <span className="mt-1 block text-xs text-rose-500">{formErrors.discountValue}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Minimum Amount</span>
                    <input type="number" min="0" value={form.minAmount} onChange={(event) => onFormChange("minAmount", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.minAmount ? <span className="mt-1 block text-xs text-rose-500">{formErrors.minAmount}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Maximum Discount</span>
                    <input type="number" min="0" value={form.maxDiscount} onChange={(event) => onFormChange("maxDiscount", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.maxDiscount ? <span className="mt-1 block text-xs text-rose-500">{formErrors.maxDiscount}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Usage Limit</span>
                    <input type="number" min="0" value={form.usageLimit} onChange={(event) => onFormChange("usageLimit", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.usageLimit ? <span className="mt-1 block text-xs text-rose-500">{formErrors.usageLimit}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Per User Limit</span>
                    <input type="number" min="1" value={form.perUserLimit} onChange={(event) => onFormChange("perUserLimit", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.perUserLimit ? <span className="mt-1 block text-xs text-rose-500">{formErrors.perUserLimit}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Valid From</span>
                    <input type="date" value={form.validFrom} onChange={(event) => onFormChange("validFrom", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Valid Till</span>
                    <input type="date" value={form.validTill} onChange={(event) => onFormChange("validTill", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.validTill ? <span className="mt-1 block text-xs text-rose-500">{formErrors.validTill}</span> : null}
                  </label>

                  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3">
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" checked={form.isActive} onChange={(event) => onFormChange("isActive", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" />
                      <span className="text-slate-700 dark:text-slate-200">Promo is active</span>
                    </label>

                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" checked={form.isReferral} onChange={(event) => onFormChange("isReferral", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400" />
                      <span className="text-slate-700 dark:text-slate-200 font-medium">Is Referral Voucher Offer</span>
                    </label>
                    
                    {form.isReferral && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                        * When active, this promo acts as a template for user referral rewards. 
                        Its values (discount, title, etc.) will be copied to vouchers earned by referrers.
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">Applicable Plans</p>
                    <div className="grid max-h-52 gap-2 overflow-y-auto rounded-xl p-3 sm:grid-cols-2">
                      {plans.length ? plans.map((plan) => (
                        <label key={plan._id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.applicablePlans.includes(plan._id)}
                            onChange={() => togglePlanSelection(plan._id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                          />
                          <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">{plan.title || plan.slug || plan._id}</span>
                        </label>
                      )) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No plans found.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="admin-secondary-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                    <TicketPercent size={15} /> {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Promo"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPromo ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedPromo.code}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedPromo.title || "No title"}</p>
                </div>
                <button type="button" onClick={() => setSelectedPromo(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Discount</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatDiscount(selectedPromo)}</p>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedPromo.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Minimum Amount</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">₹{selectedPromo.minAmount || 0}</p>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Maximum Discount</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">₹{selectedPromo.maxDiscount || 0}</p>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Usage</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedPromo.usedCount || 0} / {selectedPromo.usageLimit || "Unlimited"}</p>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Per User Limit</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedPromo.perUserLimit || 1}</p>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Valid From</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(selectedPromo.validFrom)}</p>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Valid Till</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(selectedPromo.validTill)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Applicable Plans</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selectedPromo.applicablePlans || []).length ? selectedPromo.applicablePlans.map((plan) => (
                    <span key={plan?._id || plan} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300">
                      {plan?.title || plan?.slug || plan}
                    </span>
                  )) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400">All plans</span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete promo code?"
        message={`This will permanently remove ${deleteTarget?.code || "this promo code"}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deletePromo}
        confirmLabel={deleting ? "Deleting..." : "Delete Promo"}
      />
    </div>
  );
}

export default Promo;
