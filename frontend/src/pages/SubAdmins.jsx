import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X
} from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import { ITEMS_PER_PAGE } from "../utils/constants";
import { getAdminProfile } from "../utils/auth";
import { paginate } from "../utils/helpers";

const MODULES = [
  // Content & Match
  { key: "matches", label: "Matches", group: "Content" },
  { key: "series", label: "Tours & Series", group: "Content" },
  { key: "channels", label: "Live TV", group: "Content" },
  { key: "matchHighlights", label: "Match Highlights", group: "Content" },
  { key: "starPlayers", label: "Star Players", group: "Content" },
  { key: "podcasts", label: "Podcasts", group: "Content" },
  // People
  { key: "users", label: "Users", group: "People" },
  { key: "players", label: "Players", group: "People" },
  { key: "teams", label: "Teams", group: "People" },
  // Commerce
  { key: "plans", label: "Plans", group: "Commerce" },
  { key: "promos", label: "Coupon Codes", group: "Commerce" },
  // Platform
  { key: "sports", label: "Sports", group: "Platform" },
  { key: "bannerAds", label: "Banners", group: "Platform" },
  { key: "admobPlacements", label: "AdMob Placements", group: "Platform" },
  { key: "notifications", label: "Notifications", group: "Platform" },
  { key: "reports", label: "Reports", group: "Platform" },
  { key: "socialMedia", label: "Social Media", group: "Platform" },
  { key: "legal", label: "Legal Pages", group: "Platform" },
  // Admin
  { key: "settings", label: "Settings", group: "Admin" },
  { key: "admins", label: "Sub Admins", group: "Admin" },
];

const ACTIONS = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" }
];

const createEmptyPermissions = () =>
  MODULES.reduce((moduleMap, moduleItem) => {
    moduleMap[moduleItem.key] = ACTIONS.reduce((actionMap, action) => {
      actionMap[action.key] = false;
      return actionMap;
    }, {});
    return moduleMap;
  }, {});

const defaultForm = {
  _id: "",
  name: "",
  email: "",
  password: "",
  permissions: createEmptyPermissions()
};

const FORM_AUTOCOMPLETE_VALUE = "new-sub-admin-account";

const normalizePermissions = (permissions = {}) => {
  const base = createEmptyPermissions();

  MODULES.forEach((moduleItem) => {
    ACTIONS.forEach((action) => {
      base[moduleItem.key][action.key] = Boolean(permissions?.[moduleItem.key]?.[action.key]);
    });
  });

  return base;
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

const getPermissionCount = (admin) =>
  MODULES.reduce((total, moduleItem) => {
    return total + ACTIONS.filter((action) => admin?.permissions?.[moduleItem.key]?.[action.key]).length;
  }, 0);

const getTotalPermissionCount = () => MODULES.length * ACTIONS.length;

const statusClass = (isActive) =>
  isActive
    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
    : "border border-slate-500/20 bg-slate-500/10 text-slate-500";

const neutralIconButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white";

const dangerIconButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-rose-100 px-2 py-1 text-rose-600 transition hover:bg-rose-200 disabled:opacity-60 dark:bg-rose-500/15 dark:text-rose-400 dark:hover:bg-rose-500/25";

const neutralButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

const darkButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600";

function SubAdmins() {
  const currentAdminEmail = getAdminProfile()?.email?.toLowerCase() || "";
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSubAdmins = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/sub-admins");
      setSubAdmins(Array.isArray(response?.data?.admins) ? response.data.admins : []);
    } catch (apiError) {
      setSubAdmins([]);
      setError(apiError?.response?.data?.message || "Unable to load sub admins.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadSubAdmins();
  }, []);

  useEffect(() => {
    if (!modalOpen || editMode) {
      return undefined;
    }

    const clearAutofillTimer = window.setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.value = "";
      }

      if (passwordInputRef.current) {
        passwordInputRef.current.value = "";
      }

      setForm((prev) => ({
        ...prev,
        email: "",
        password: ""
      }));
    }, 250);

    return () => window.clearTimeout(clearAutofillTimer);
  }, [editMode, modalOpen]);

  const stats = useMemo(() => {
    const active = subAdmins.filter((admin) => admin.isActive).length;
    const totalGrants = subAdmins.reduce((total, admin) => total + getPermissionCount(admin), 0);

    return {
      total: subAdmins.length,
      active,
      inactive: subAdmins.length - active,
      totalGrants
    };
  }, [subAdmins]);

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subAdmins.filter((admin) => {
      const statusOk = statusFilter === "all" ? true : statusFilter === "active" ? admin.isActive : !admin.isActive;
      const haystack = [admin.name, admin.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return statusOk && (!query || haystack.includes(query));
    });
  }, [search, statusFilter, subAdmins]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE));
  const pagedAdmins = useMemo(() => paginate(filteredAdmins, page, ITEMS_PER_PAGE), [filteredAdmins, page]);
  const visiblePermissionModules = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();

    if (!query) {
      return MODULES;
    }

    return MODULES.filter((moduleItem) => moduleItem.label.toLowerCase().includes(query));
  }, [permissionSearch]);

  const updateFormField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const updatePermission = (moduleKey, actionKey, checked) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [actionKey]: checked
        }
      }
    }));
  };

  const setModulePermissions = (moduleKey, checked) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: ACTIONS.reduce((next, action) => {
          next[action.key] = checked;
          return next;
        }, {})
      }
    }));
  };

  const setActionPermissions = (actionKey, checked) => {
    setForm((prev) => ({
      ...prev,
      permissions: MODULES.reduce((nextPermissions, moduleItem) => {
        nextPermissions[moduleItem.key] = {
          ...prev.permissions[moduleItem.key],
          [actionKey]: checked
        };
        return nextPermissions;
      }, {})
    }));
  };

  const setAllPermissions = (checked) => {
    setForm((prev) => ({
      ...prev,
      permissions: MODULES.reduce((nextPermissions, moduleItem) => {
        nextPermissions[moduleItem.key] = ACTIONS.reduce((nextActions, action) => {
          nextActions[action.key] = checked;
          return nextActions;
        }, {});
        return nextPermissions;
      }, {})
    }));
  };

  const openCreate = () => {
    setEditMode(false);
    setForm({ ...defaultForm, permissions: createEmptyPermissions() });
    setFormErrors({});
    setPermissionSearch("");
    setModalOpen(true);
  };

  const openEdit = (admin) => {
    setEditMode(true);
    setFormErrors({});
    setForm({
      _id: admin?._id || "",
      name: admin?.name || "",
      email: admin?.email || "",
      password: "",
      permissions: normalizePermissions(admin?.permissions)
    });
    setPermissionSearch("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditMode(false);
    setForm({ ...defaultForm, permissions: createEmptyPermissions() });
    setFormErrors({});
    setPermissionSearch("");
  };

  const validate = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = form.email.trim().toLowerCase();

    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!editMode && !emailPattern.test(email)) nextErrors.email = "Valid email is required";
    if (!editMode && email && email === currentAdminEmail) {
      nextErrors.email = "Use a different email. Super admin email cannot be used for a sub admin.";
    }
    if (!editMode && form.password.length < 6) nextErrors.password = "Password must be at least 6 characters";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveSubAdmin = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        permissions: form.permissions
      };

      if (!editMode) {
        payload.email = form.email.trim().toLowerCase();
        payload.password = form.password;
      }

      const response = editMode && form._id
        ? await api.put(`/admin/sub-admins/${form._id}`, payload)
        : await api.post("/admin/sub-admins", payload);

      const saved = response?.data?.admin;

      if (saved?._id) {
        setSubAdmins((prev) => (editMode ? prev.map((item) => (item._id === saved._id ? saved : item)) : [saved, ...prev]));
      } else {
        await loadSubAdmins();
      }

      closeModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save sub admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (admin) => {
    if (!admin?._id) return;

    try {
      setActionId(admin._id);
      setError("");

      const response = await api.patch(`/admin/sub-admins/${admin._id}/toggle`);
      const updated = response?.data?.admin;

      if (updated?._id) {
        setSubAdmins((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        setSelectedAdmin((prev) => (prev?._id === updated._id ? updated : prev));
      } else {
        await loadSubAdmins();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to update sub admin status.");
    } finally {
      setActionId("");
    }
  };

  const deleteSubAdmin = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleting(true);
      setError("");

      await api.delete(`/admin/sub-admins/${deleteTarget._id}`);
      setSubAdmins((prev) => prev.filter((admin) => admin._id !== deleteTarget._id));
      setSelectedAdmin((prev) => (prev?._id === deleteTarget._id ? null : prev));
      setDeleteTarget(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete sub admin.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "admin",
      label: "Sub Admin",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-500">
            {(row.name || row.email || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{row.name || "Unnamed Admin"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.email || "-"}</p>
          </div>
        </div>
      )
    },
    {
      key: "permissions",
      label: "Permissions",
      render: (row) => (
        <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-500">
          {getPermissionCount(row)} / {getTotalPermissionCount()} granted
        </span>
      )
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs ${statusClass(row.isActive)}`}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      )
    },
    { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleStatus(row)}
            disabled={actionId === row._id}
            className={neutralIconButtonClass}
            title={row.isActive ? "Deactivate" : "Activate"}
          >
            {row.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setSelectedAdmin(row)}
            className={neutralIconButtonClass}
            title="View"
          >
            <Eye size={13} />
          </button>
          <button
            type="button"
            onClick={() => openEdit(row)}
            className={neutralIconButtonClass}
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className={dangerIconButtonClass}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Sub Admins"
        subtitle="Create sub admins, assign module permissions, and manage account access."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSubAdmins}
              className={neutralButtonClass}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className={darkButtonClass}
            >
              <Plus size={15} /> Add Sub Admin
            </button>
          </div>
        }
      />

      {error ? <p className="mb-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p> : null}

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr),200px]">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email" />
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

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Sub Admins</p>
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
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Permission Grants</p>
          <p className="mt-2 text-2xl font-semibold text-indigo-500">{stats.totalGrants}</p>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={pagedAdmins}
            rowKey="_id"
            emptyTitle="No sub admins found"
            emptyMessage="Create a sub admin to delegate admin panel access."
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <p>
              Showing {pagedAdmins.length} of {filteredAdmins.length} sub admins
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                disabled={page === 1}
              >
                Prev
              </button>
              <span className="rounded-lg bg-slate-200 px-3 py-1.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
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
              className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {editMode ? "Edit Sub Admin" : "Create Sub Admin"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Assign only the permissions this admin should use.
                  </p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveSubAdmin} autoComplete="off" className="space-y-5">
                <div className="hidden" aria-hidden="true">
                  <input type="text" name="username" autoComplete="username" tabIndex="-1" />
                  <input type="password" name="password" autoComplete="current-password" tabIndex="-1" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Name</span>
                    <input
                      name="subAdminName"
                      autoComplete="off"
                      value={form.name}
                      onChange={(event) => updateFormField("name", event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                    />
                    {formErrors.name ? <span className="mt-1 block text-xs text-rose-500">{formErrors.name}</span> : null}
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Email</span>
                    <input
                      ref={emailInputRef}
                      type="text"
                      inputMode="email"
                      name="subAdminEmail"
                      autoComplete={FORM_AUTOCOMPLETE_VALUE}
                      value={form.email}
                      disabled={editMode}
                      onChange={(event) => updateFormField("email", event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800"
                    />
                    {formErrors.email ? <span className="mt-1 block text-xs text-rose-500">{formErrors.email}</span> : null}
                  </label>

                  {!editMode ? (
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-500 dark:text-slate-400">Password</span>
                      <input
                        ref={passwordInputRef}
                        type="password"
                        name="subAdminNewPassword"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(event) => updateFormField("password", event.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                      />
                      {formErrors.password ? <span className="mt-1 block text-xs text-rose-500">{formErrors.password}</span> : null}
                    </label>
                  ) : null}
                </div>

                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Module Permissions</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={permissionSearch}
                        onChange={(event) => setPermissionSearch(event.target.value)}
                        placeholder="Find module..."
                        className="h-9 w-44 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setAllPermissions(true)}
                        className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25"
                      >
                        Grant All
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllPermissions(false)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Module</th>
                          {ACTIONS.map((action) => (
                            <th key={action.key} className="px-4 py-3 font-medium">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={MODULES.every((moduleItem) => form.permissions[moduleItem.key]?.[action.key])}
                                  onChange={(event) => setActionPermissions(action.key, event.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                                />
                                <span>{action.label}</span>
                              </label>
                            </th>
                          ))}
                          <th className="px-4 py-3 font-medium">All</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const rows = [];
                          let lastGroup = null;
                          visiblePermissionModules.forEach((moduleItem) => {
                            // Insert a group separator row when the group changes
                            if (moduleItem.group && moduleItem.group !== lastGroup) {
                              lastGroup = moduleItem.group;
                              rows.push(
                                <tr key={`group-${moduleItem.group}`} className="border-t-2 border-slate-200 dark:border-slate-700">
                                  <td
                                    colSpan={ACTIONS.length + 2}
                                    className="bg-slate-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-800/60 dark:text-slate-500"
                                  >
                                    {moduleItem.group}
                                  </td>
                                </tr>
                              );
                            }

                            const allChecked = ACTIONS.every((action) => form.permissions[moduleItem.key]?.[action.key]);
                            rows.push(
                              <tr key={moduleItem.key} className="border-t border-slate-100 dark:border-slate-800/60">
                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{moduleItem.label}</td>
                                {ACTIONS.map((action) => (
                                  <td key={action.key} className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(form.permissions[moduleItem.key]?.[action.key])}
                                      onChange={(event) => updatePermission(moduleItem.key, action.key, event.target.checked)}
                                      className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                                    />
                                  </td>
                                ))}
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={allChecked}
                                    onChange={(event) => setModulePermissions(moduleItem.key, event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                                  />
                                </td>
                              </tr>
                            );
                          });

                          if (!visiblePermissionModules.length) {
                            rows.push(
                              <tr key="empty">
                                <td colSpan={ACTIONS.length + 2} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                  No permission modules match your search.
                                </td>
                              </tr>
                            );
                          }

                          return rows;
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                  >
                    <ShieldCheck size={15} /> {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Sub Admin"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAdmin ? (
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
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedAdmin.name}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedAdmin.email}</p>
                </div>
                <button type="button" onClick={() => setSelectedAdmin(null)} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs ${statusClass(selectedAdmin.isActive)}`}>
                    {selectedAdmin.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Created</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(selectedAdmin.createdAt)}</p>
                </div>
                <div className="rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Permissions</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {getPermissionCount(selectedAdmin)} / {getTotalPermissionCount()} granted
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                <p className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-200">Permission Details</p>
                {(() => {
                  const groups = {};
                  MODULES.forEach((moduleItem) => {
                    const g = moduleItem.group || "Other";
                    if (!groups[g]) groups[g] = [];
                    groups[g].push(moduleItem);
                  });

                  return Object.entries(groups).map(([groupName, items]) => (
                    <div key={groupName} className="mb-5 last:mb-0">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {groupName}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {items.map((moduleItem) => {
                          const grantedActions = ACTIONS.filter(
                            (action) => selectedAdmin?.permissions?.[moduleItem.key]?.[action.key]
                          );
                          return (
                            <div
                              key={moduleItem.key}
                              className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40"
                            >
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{moduleItem.label}</p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {grantedActions.length ? (
                                  grantedActions.map((action) => (
                                    <span
                                      key={action.key}
                                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400"
                                    >
                                      <CheckCircle2 size={10} /> {action.label}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500">No access</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete sub admin?"
        message={`This will permanently remove ${deleteTarget?.name || deleteTarget?.email || "this sub admin"}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteSubAdmin}
        confirmLabel={deleting ? "Deleting..." : "Delete Sub Admin"}
      />
    </div>
  );
}

export default SubAdmins;
