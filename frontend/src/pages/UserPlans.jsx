import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Eye, Trash2, X, XCircle } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import useDebounce from "../hooks/useDebounce";
import { ITEMS_PER_PAGE } from "../utils/constants";
import { paginate } from "../utils/helpers";

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
};

const formatMoney = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

function UserPlans() {
  const outlet = useOutletContext();
  const globalSearch = outlet?.search || "";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [selectedSub, setSelectedSub] = useState(null);
  const [subToDelete, setSubToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const query = (search || globalSearch).trim();
  const debouncedQuery = useDebounce(query, 400);

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/subscriptions/stats/overview");
      if (response?.data?.success) {
        setStats(response.data.stats);
      }
    } catch {
      // Ignore stat errors silently
    }
  };

  const fetchSubscriptions = async (searchTerm = "") => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/subscriptions", {
        params: searchTerm ? { search: searchTerm, limit: 1000 } : { limit: 1000 }
      });

      const apiSubs = Array.isArray(response?.data?.subscriptions) ? response.data.subscriptions : [];
      setSubscriptions(apiSubs);
      fetchStats();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to fetch subscriptions.");
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(debouncedQuery);
  }, [debouncedQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(subscriptions.length / ITEMS_PER_PAGE));
  const pagedSubscriptions = useMemo(() => paginate(subscriptions, page, ITEMS_PER_PAGE), [subscriptions, page]);

  const handleDeleteSub = async () => {
    if (!subToDelete?._id) return;

    try {
      setDeleting(true);
      await api.delete(`/admin/subscriptions/${subToDelete._id}`);
      setSubscriptions((prev) => prev.filter((sub) => sub._id !== subToDelete._id));
      setSubToDelete(null);
      if (selectedSub?._id === subToDelete._id) setSelectedSub(null);
      fetchStats();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete subscription.");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdating(true);
      const response = await api.patch(`/admin/subscriptions/${id}/status`, { status: newStatus });
      
      if (response?.data?.success) {
        setSubscriptions((prev) =>
          prev.map((sub) => (sub._id === id ? { ...sub, status: newStatus } : sub))
        );
        if (selectedSub?._id === id) {
          setSelectedSub((prev) => ({ ...prev, status: newStatus }));
        }
        fetchStats();
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      key: "user",
      label: "User",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{row.userId?.fullName || "Unknown User"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.userId?.email || row.userId?.mobile || "-"}</p>
        </div>
      )
    },
    {
      key: "plan",
      label: "Plan Detail",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{row.planId?.title || "Unknown Plan"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatMoney(row.amountPaid)} ({row.planId?.billingType || "N/A"})</p>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        let colors = "border-slate-500/20 bg-slate-500/10 text-slate-500";
        if (row.status === "active") colors = "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
        if (row.status === "cancelled") colors = "border-amber-500/20 bg-amber-500/10 text-amber-500";
        if (row.status === "expired") colors = "border-rose-500/20 bg-rose-500/10 text-rose-500";
        
        return (
          <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${colors}`}>
            {row.status || "Unknown"}
          </span>
        );
      }
    },
    {
      key: "dates",
      label: "Duration",
      render: (row) => (
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-300">From: {formatDate(row.startDate)}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">To: {formatDate(row.endDate)}</p>
        </div>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedSub(row)}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
          >
            <Eye size={13} /> 
          </button>
          <button
            type="button"
            onClick={() => setSubToDelete(row)}
            className="flex items-center gap-1 rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-500"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="User Plans" subtitle="Monitor user subscriptions, active plans, and billing." />

      {stats && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Subscriptions</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.total || 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Active</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-500">{stats.active || 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Cancelled</p>
            <p className="mt-2 text-2xl font-semibold text-amber-500">{stats.cancelled || 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Expired</p>
            <p className="mt-2 text-2xl font-semibold text-rose-500">{stats.expired || 0}</p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by user or plan title" className="max-w-lg" />
      </div>

      {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

      {loading ? (
        <Loader />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={pagedSubscriptions}
            emptyTitle="No subscriptions found"
            emptyMessage="Try a different search keyword."
            rowKey="_id"
          />

          {subscriptions.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <p>
                Showing {pagedSubscriptions.length} of {subscriptions.length} records
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50 dark:border-slate-700"
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
                  className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50 dark:border-slate-700"
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedSub ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Subscription Details</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ID: {selectedSub._id}</p>
                </div>
                <button type="button" onClick={() => setSelectedSub(null)} className="text-slate-500">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400">User</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{selectedSub.userId?.fullName || "-"}</p>
                  <p className="text-slate-600 dark:text-slate-300">{selectedSub.userId?.email || selectedSub.userId?.mobile}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400">Plan</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{selectedSub.planId?.title || "-"}</p>
                  <p className="text-slate-600 dark:text-slate-300">{formatMoney(selectedSub.amountPaid)} / {selectedSub.planId?.billingType}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">Start Date</p>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{formatDate(selectedSub.startDate)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">End Date</p>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{formatDate(selectedSub.endDate)}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400">Status</p>
                  <p className="font-medium capitalize text-slate-800 dark:text-slate-100">{selectedSub.status}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedSub._id, "active")}
                  disabled={updating || selectedSub.status === "active"}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-600 disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Mark Active
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedSub._id, "cancelled")}
                  disabled={updating || selectedSub.status === "cancelled"}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-2 text-sm text-amber-500 disabled:opacity-50"
                >
                  <XCircle size={14} /> Cancel Plan
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(subToDelete)}
        title="Delete this subscription?"
        message="This action will permanently remove the subscription record. The user will instantly lose access."
        onCancel={() => setSubToDelete(null)}
        onConfirm={handleDeleteSub}
        confirmLabel={deleting ? "Deleting..." : "Delete Subscription"}
      />
    </div>
  );
}

export default UserPlans;
