import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownUp, Eye, Pencil, Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";

const defaultForm = {
  _id: "",
  title: "",
  slug: "",
  price: "",
  currency: "INR",
  billingType: "monthly",
  durationDays: "30",
  features: "",
  buttonText: "Buy Now",
  description: "",
  badge: "",
  isActive: true,
  sortOrder: "0"
};

const billingOptions = [
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "Per Match", value: "per_match" }
];

const formatMoney = (value, currency = "INR") => {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

const normalizeFeatures = (value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionPlanId, setActionPlanId] = useState("");

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/plans", {
        params: { page: 1, limit: 200 }
      });

      setPlans(Array.isArray(response?.data?.plans) ? response.data.plans : []);
    } catch (apiError) {
      setPlans([]);
      setError(apiError?.response?.data?.message || "Unable to load plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const stats = useMemo(() => {
    const active = plans.filter((item) => item.isActive).length;
    const yearly = plans.filter((item) => item.billingType === "yearly").length;
    const monthly = plans.filter((item) => item.billingType === "monthly").length;

    return {
      total: plans.length,
      active,
      inactive: plans.length - active,
      yearly,
      monthly
    };
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return plans.filter((item) => {
      const statusOk =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? item.isActive
            : !item.isActive;

      const haystack = [
        item.title,
        item.slug,
        item.billingType,
        item.currency,
        item.badge,
        item.description,
        ...(item.features || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchOk = !query || haystack.includes(query);
      return statusOk && searchOk;
    });
  }, [plans, search, statusFilter]);

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

  const openEdit = (plan) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: plan?._id || "",
      title: plan?.title || "",
      slug: plan?.slug || "",
      price: String(plan?.price ?? ""),
      currency: plan?.currency || "INR",
      billingType: plan?.billingType || "monthly",
      durationDays: String(plan?.durationDays ?? 30),
      features: Array.isArray(plan?.features) ? plan.features.join("\n") : "",
      buttonText: plan?.buttonText || "Buy Now",
      description: plan?.description || "",
      badge: plan?.badge || "",
      isActive: Boolean(plan?.isActive),
      sortOrder: String(plan?.sortOrder ?? 0)
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

    if (!form.title.trim()) nextErrors.title = "Plan title is required";
    if (form.price === "" || Number(form.price) < 0) nextErrors.price = "Enter a valid price";
    if (form.durationDays === "" || Number(form.durationDays) < 1) nextErrors.durationDays = "Duration must be at least 1 day";
    if (!form.billingType) nextErrors.billingType = "Select a billing type";
    if (!form.currency.trim()) nextErrors.currency = "Currency is required";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const savePlan = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        price: Number(form.price),
        currency: form.currency.trim().toUpperCase(),
        billingType: form.billingType,
        durationDays: Number(form.durationDays),
        features: normalizeFeatures(form.features),
        buttonText: form.buttonText.trim() || "Buy Now",
        description: form.description.trim(),
        badge: form.badge.trim(),
        isActive: Boolean(form.isActive),
        sortOrder: Number(form.sortOrder || 0)
      };

      const response = editMode && form._id
        ? await api.put(`/admin/plans/${form._id}`, payload)
        : await api.post("/admin/plans", payload);

      const saved = response?.data?.plan;

      if (saved?._id) {
        setPlans((prev) => {
          const nextPlans = editMode
            ? prev.map((item) => (item._id === saved._id ? saved : item))
            : [...prev, saved];

          return nextPlans.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        });
      } else {
        await loadPlans();
      }

      closeModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save plan.");
    } finally {
      setSubmitting(false);
    }
  };

  const openView = async (plan) => {
    if (!plan?._id) {
      setSelectedPlan(plan || null);
      return;
    }

    try {
      const response = await api.get(`/admin/plans/${plan._id}`);
      setSelectedPlan(response?.data?.plan || plan);
    } catch {
      setSelectedPlan(plan);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      await api.delete(`/admin/plans/${deleteTarget._id}`);
      setPlans((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
      setSelectedPlan((prev) => (prev?._id === deleteTarget._id ? null : prev));
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete plan.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (plan) => {
    if (!plan?._id) {
      return;
    }

    try {
      setActionPlanId(plan._id);
      setError("");
      const response = await api.patch(`/admin/plans/${plan._id}/toggle-status`);
      const updated = response?.data?.plan;

      if (updated?._id) {
        setPlans((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        setSelectedPlan((prev) => (prev?._id === updated._id ? updated : prev));
      } else {
        await loadPlans();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to update plan status.");
    } finally {
      setActionPlanId("");
    }
  };

  const updateSortOrder = async (plan, nextSortOrder) => {
    if (!plan?._id) {
      return;
    }

    try {
      setActionPlanId(plan._id);
      setError("");
      const response = await api.patch(`/admin/plans/${plan._id}/sort`, {
        sortOrder: Number(nextSortOrder)
      });
      const updated = response?.data?.plan;

      if (updated?._id) {
        setPlans((prev) =>
          prev
            .map((item) => (item._id === updated._id ? updated : item))
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        );
        setSelectedPlan((prev) => (prev?._id === updated._id ? updated : prev));
      } else {
        await loadPlans();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to update sort order.");
    } finally {
      setActionPlanId("");
    }
  };

  return (
    <div>
      <PageHeader
        title="Plans"
        subtitle="Create and manage subscription plans shown across the PlayON platform."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadPlans}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={15} /> Add Plan
            </button>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-rose-500">{error}</p> : null}

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,2fr),220px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, slug, billing type, badge..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Status: All</option>
          <option value="active">Status: Active</option>
          <option value="inactive">Status: Inactive</option>
        </select>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Plans</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-500">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Inactive</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.inactive}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Monthly</p>
          <p className="mt-2 text-2xl font-semibold text-indigo-500">{stats.monthly}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Yearly</p>
          <p className="mt-2 text-2xl font-semibold text-violet-500">{stats.yearly}</p>
        </div>
      </div>

      {loading ? (
        <Loader lines={6} />
      ) : !filteredPlans.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No plans found for this filter.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredPlans.map((plan, index) => (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{plan.title || "Untitled Plan"}</h3>
                    {plan.badge ? (
                      <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-500">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {formatMoney(plan.price, plan.currency)} · {plan.billingType} · {plan.durationDays} days
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    plan.isActive
                      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                      : "border border-slate-500/20 bg-slate-500/10 text-slate-500"
                  }`}
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                {plan.description || "No description added yet."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(plan.features || []).slice(0, 3).map((feature) => (
                  <span key={feature} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    {feature}
                  </span>
                ))}
                {plan.features?.length > 3 ? (
                  <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    +{plan.features.length - 3} more
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleStatus(plan)}
                  disabled={actionPlanId === plan._id}
                  className="inline-flex items-center gap-1 rounded-xl border border-indigo-300 px-3 py-2 text-sm text-indigo-600 disabled:opacity-70"
                >
                  {plan.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                  {plan.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => updateSortOrder(plan, (Number(plan.sortOrder) || 0) + 1)}
                  disabled={actionPlanId === plan._id}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
                >
                  <ArrowDownUp size={14} />
                  Sort {plan.sortOrder ?? 0}
                </button>
                <button
                  type="button"
                  onClick={() => openView(plan)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(plan)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(plan)}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-300 px-3 py-2 text-sm text-rose-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Plan" : "Create Plan"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Control title, pricing, features, status, and sort order for admin plans.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={savePlan} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Title</span>
                    <input value={form.title} onChange={(event) => onFormChange("title", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.title ? <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Slug</span>
                    <input value={form.slug} onChange={(event) => onFormChange("slug", event.target.value)} placeholder="auto-generated if empty" className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Price</span>
                    <input type="number" min="0" value={form.price} onChange={(event) => onFormChange("price", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.price ? <span className="mt-1 block text-xs text-rose-500">{formErrors.price}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Currency</span>
                    <input value={form.currency} onChange={(event) => onFormChange("currency", event.target.value.toUpperCase())} maxLength={3} className="h-11 w-full rounded-xl border border-slate-200 px-3 uppercase outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.currency ? <span className="mt-1 block text-xs text-rose-500">{formErrors.currency}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Billing Type</span>
                    <select value={form.billingType} onChange={(event) => onFormChange("billingType", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                      {billingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Duration Days</span>
                    <input type="number" min="1" value={form.durationDays} onChange={(event) => onFormChange("durationDays", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.durationDays ? <span className="mt-1 block text-xs text-rose-500">{formErrors.durationDays}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Button Text</span>
                    <input value={form.buttonText} onChange={(event) => onFormChange("buttonText", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Badge</span>
                    <input value={form.badge} onChange={(event) => onFormChange("badge", event.target.value)} placeholder="Popular, Best value..." className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sort Order</span>
                    <input type="number" value={form.sortOrder} onChange={(event) => onFormChange("sortOrder", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
                    <input type="checkbox" checked={form.isActive} onChange={(event) => onFormChange("isActive", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" />
                    <span className="text-slate-700 dark:text-slate-200">Plan is active</span>
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
                    <textarea rows="3" value={form.description} onChange={(event) => onFormChange("description", event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Features</span>
                    <textarea rows="5" value={form.features} onChange={(event) => onFormChange("features", event.target.value)} placeholder={"One feature per line\nHD streaming\nAd-free playback"} className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPlan ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedPlan.title || "Untitled Plan"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedPlan.slug || "No slug"}</p>
                </div>
                <button type="button" onClick={() => setSelectedPlan(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Price</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatMoney(selectedPlan.price, selectedPlan.currency)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Cycle</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedPlan.billingType || "-"} | {selectedPlan.durationDays || 0} days</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Button Text</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedPlan.buttonText || "-"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedPlan.isActive ? "Active" : "Inactive"} | Sort {selectedPlan.sortOrder ?? 0}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{selectedPlan.description || "-"}</p>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Features</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {(selectedPlan.features || []).length ? (
                    selectedPlan.features.map((feature) => (
                      <li key={feature} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                        {feature}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400">No features added.</li>
                  )}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this plan?"
        message={`This will permanently remove ${deleteTarget?.title || "this plan"}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Plan"}
      />
    </div>
  );
}

export default Plans;
