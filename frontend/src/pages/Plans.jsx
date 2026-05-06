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
  planType: "monthly_pass",
  matchId: "",
  teamId: "",
  seriesId: "",
  durationDays: "30",
  features: "",
  buttonText: "Unlock Now",
  description: "",
  badge: "",
  isActive: true,
  sortOrder: "0"
};

const PLAN_TYPE_OPTIONS = [
  { label: "Monthly Pass", value: "monthly_pass", color: "indigo" },
  { label: "Yearly Pass", value: "yearly_pass", color: "violet" },
  { label: "Match Pass", value: "match_pass", color: "amber" },
  { label: "Team Pass", value: "team_pass", color: "rose" },
  { label: "Series Pass", value: "series_pass", color: "emerald" },
  { label: "Ad-Free", value: "ad_free", color: "sky" }
];

const PLAN_TYPE_LABELS = {
  monthly_pass: "Monthly Pass",
  yearly_pass: "Yearly Pass",
  match_pass: "Match Pass",
  team_pass: "Team Pass",
  series_pass: "Series Pass",
  ad_free: "Ad-Free"
};

const PLAN_TYPE_COLORS = {
  monthly_pass: "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400",
  yearly_pass: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400",
  match_pass: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400",
  team_pass: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400",
  series_pass: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400",
  ad_free: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400"
};

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
  // const [allMatches, setAllMatches] = useState([]);
  // const [allTeams, setAllTeams] = useState([]);
  // const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planTypeFilter, setPlanTypeFilter] = useState("all");
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

      const plansRes = await api.get("/admin/plans", {
        params: { page: 1, limit: 200 }
      });

      setPlans(
        Array.isArray(plansRes?.data?.plans)
          ? plansRes.data.plans
          : []
      );
    } catch (apiError) {
      setPlans([]);
      setError(
        apiError?.response?.data?.message ||
        "Unable to load plans."
      );
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadPlans();
  }, []);



  const stats = useMemo(() => {
    const active = plans.filter((item) => item.isActive).length;
    const byType = {};
    PLAN_TYPE_OPTIONS.forEach(opt => {
      byType[opt.value] = plans.filter(p => p.planType === opt.value).length;
    });
    return { total: plans.length, active, inactive: plans.length - active, ...byType };
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    return plans.filter((item) => {
      const statusOk = statusFilter === "all" ? true : statusFilter === "active" ? item.isActive : !item.isActive;
      const typeOk = planTypeFilter === "all" ? true : item.planType === planTypeFilter;
      const haystack = [
        item.title,
        item.slug,
        item.planType,
        item.currency,
        item.badge,
        item.description,
        item.buttonText,
        // (item.matchId),
        // (item.teamId),
        // (item.seriesId),
        ...(item.features || [])
      ]
        .filter(Boolean).join(" ").toLowerCase();
      return statusOk && typeOk && (!query || haystack.includes(query));
    });
  }, [plans, search, statusFilter, planTypeFilter]);

  const onFormChange = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };

      if (key === "planType") {
        const map = {
          monthly_pass: "Unlock Now",
          yearly_pass: "Unlock Now",
          match_pass: "Choose The Match",
          team_pass: "Choose The Team",
          series_pass: "Choose The Series",
          ad_free: "Go Ad-Free"
        };

        updated.buttonText = map[value] || "Unlock Now";
      }

      return updated;
    });

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
      planType: plan?.planType || "monthly_pass",
      matchId: plan?.matchId?._id || plan?.matchId || "",
      teamId: plan?.teamId?._id || plan?.teamId || "",
      seriesId: plan?.seriesId?._id || plan?.seriesId || "",
      durationDays: String(plan?.durationDays ?? 30),
      features: Array.isArray(plan?.features) ? plan.features.join("\n") : "",
      buttonText: plan?.buttonText || "Unlock Now",
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
    if (!form.planType) nextErrors.planType = "Select a plan type";
    if (!form.currency.trim()) nextErrors.currency = "Currency is required";
    // if (form.planType === "match_pass" && !form.matchId) nextErrors.matchId = "Select a match for Match Pass";
    // if (form.planType === "team_pass" && !form.teamId) nextErrors.teamId = "Select a team for Team Pass";
    // if (form.planType === "series_pass" && !form.seriesId) nextErrors.seriesId = "Select a series for Series Pass";
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
        planType: form.planType,
        // matchId: form.planType === "match_pass" ? form.matchId || null : null,
        // teamId: form.planType === "team_pass" ? form.teamId || null : null,
        // seriesId: form.planType === "series_pass" ? form.seriesId || null : null,
        matchId: null,
        teamId: null,
        seriesId: null,
        durationDays: Number(form.durationDays),
        features: normalizeFeatures(form.features),
        buttonText: form.buttonText || "Unlock Now",
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
              className="admin-toolbar-btn"
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

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,2fr),200px,200px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, plan type, badge..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
        />
        <select
          value={planTypeFilter}
          onChange={(event) => setPlanTypeFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Type: All</option>
          {PLAN_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">Status: All</option>
          <option value="active">Status: Active</option>
          <option value="inactive">Status: Inactive</option>
        </select>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Plans</p>
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
        <div className="rounded-2xl bg-indigo-50 p-4 shadow-sm dark:bg-indigo-950/30">
          <p className="text-xs uppercase tracking-wide text-indigo-500">By Type</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PLAN_TYPE_OPTIONS.map(opt => (
              <span key={opt.value} className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${PLAN_TYPE_COLORS[opt.value]}`}>
                {opt.label.split(" ")[0]} {stats[opt.value] || 0}
              </span>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <Loader lines={6} />
      ) : !filteredPlans.length ? (
        <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
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
              className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{plan.title || "Untitled Plan"}</h3>
                    {plan.badge && (
                      <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-500">{plan.badge}</span>
                    )}
                    {plan.planType && (
                      <span className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${PLAN_TYPE_COLORS[plan.planType] || ""}`}>
                        {PLAN_TYPE_LABELS[plan.planType] || plan.planType}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {formatMoney(plan.price, plan.currency)} - {plan.durationDays} days
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${plan.isActive
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
                  <span key={feature} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300">
                    {feature}
                  </span>
                ))}
                {plan.features?.length > 3 ? (
                  <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400">
                    +{plan.features.length - 3} more
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleStatus(plan)}
                  disabled={actionPlanId === plan._id}
                  className="admin-action-btn"
                >
                  {plan.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                  {plan.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => updateSortOrder(plan, (Number(plan.sortOrder) || 0) + 1)}
                  disabled={actionPlanId === plan._id}
                  className="admin-action-btn"
                >
                  <ArrowDownUp size={14} />
                  Sort {plan.sortOrder ?? 0}
                </button>
                <button
                  type="button"
                  onClick={() => openView(plan)}
                  className="admin-action-btn"
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(plan)}
                  className="admin-action-btn"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(plan)}
                  className="admin-action-btn-danger"
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
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Plan" : "Create Plan"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create reusable subscription templates. Users will choose team, match, or series during purchase.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={savePlan} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Title</span>
                    <input value={form.title} onChange={(event) => onFormChange("title", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.title ? <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Slug</span>
                    <input value={form.slug} onChange={(event) => onFormChange("slug", event.target.value)} placeholder="auto-generated if empty" className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Price</span>
                    <input type="number" min="0" value={form.price} onChange={(event) => onFormChange("price", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.price ? <span className="mt-1 block text-xs text-rose-500">{formErrors.price}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Currency</span>
                    <input value={form.currency} onChange={(event) => onFormChange("currency", event.target.value.toUpperCase())} maxLength={3} className="h-11 w-full rounded-xl border border-slate-200 px-3 uppercase outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.currency ? <span className="mt-1 block text-xs text-rose-500">{formErrors.currency}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Plan Type</span>
                    <select value={form.planType} onChange={(event) => onFormChange("planType", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                      {PLAN_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {formErrors.planType ? <span className="mt-1 block text-xs text-rose-500">{formErrors.planType}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Duration Days</span>
                    <input type="number" min="1" value={form.durationDays} onChange={(event) => onFormChange("durationDays", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                    {formErrors.durationDays ? <span className="mt-1 block text-xs text-rose-500">{formErrors.durationDays}</span> : null}
                  </label>



                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Button Text</span>
                    <select value={form.buttonText} onChange={(event) => onFormChange("buttonText", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                      <option value="Unlock Now">Unlock Now</option>
                      <option value="Choose The Match">Choose The Match</option>
                      <option value="Choose The Team">Choose The Team</option>
                      <option value="Choose The Series">Choose The Series</option>
                      <option value="Go Ad-Free">Go Ad-Free</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Badge</span>
                    <input value={form.badge} onChange={(event) => onFormChange("badge", event.target.value)} placeholder="Popular, Best value..." className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sort Order</span>
                    <input type="number" value={form.sortOrder} onChange={(event) => onFormChange("sortOrder", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                    <input type="checkbox" checked={form.isActive} onChange={(event) => onFormChange("isActive", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" />
                    <span className="text-slate-700 dark:text-slate-200">Plan is active</span>
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
                    <textarea rows="3" value={form.description} onChange={(event) => onFormChange("description", event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Features</span>
                    <textarea rows="5" value={form.features} onChange={(event) => onFormChange("features", event.target.value)} placeholder={"One feature per line\nHD streaming\nAd-free playback"} className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="admin-secondary-btn">
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
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
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
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Price</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatMoney(selectedPlan.price, selectedPlan.currency)}</p>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Plan Type</p>
                  <span className={`mt-2 inline-block rounded-lg border px-2.5 py-1 text-sm font-semibold ${PLAN_TYPE_COLORS[selectedPlan.planType] || "text-slate-600"}`}>
                    {PLAN_TYPE_LABELS[selectedPlan.planType] || selectedPlan.planType || "-"}
                  </span>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Duration</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedPlan.durationDays || 0} days</p>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedPlan.isActive ? "Active" : "Inactive"} - Sort {selectedPlan.sortOrder ?? 0}</p>
                </div>
                {selectedPlan.planType === "match_pass" && selectedPlan.matchId && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20 md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-amber-600">Linked Match</p>
                    <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                      {(selectedPlan.matchId)}
                    </p>
                  </div>
                )}
                {selectedPlan.planType === "team_pass" && selectedPlan.teamId && (
                  <div className="rounded-xl bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/20 md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-rose-600">Team</p>
                    <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{(selectedPlan.teamId)}</p>
                  </div>
                )}
                {selectedPlan.planType === "series_pass" && selectedPlan.seriesId && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20 md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-emerald-600">Linked Series</p>
                    <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                      {(selectedPlan.seriesId)}
                    </p>
                  </div>
                )}
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Button Text</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedPlan.buttonText || "-"}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{selectedPlan.description || "-"}</p>
              </div>

              <div className="mt-4 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Features</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {(selectedPlan.features || []).length ? (
                    selectedPlan.features.map((feature) => (
                      <li key={feature} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">{feature}</li>
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
