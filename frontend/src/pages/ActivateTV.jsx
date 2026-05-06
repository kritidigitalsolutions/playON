import { useEffect, useMemo, useState } from "react";
import { Clock, RefreshCw, Tv, UserRound } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import useDebounce from "../hooks/useDebounce";
import { ITEMS_PER_PAGE } from "../utils/constants";
import { paginate } from "../utils/helpers";

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getInitial = (user) => (user?.fullName || user?.mobile || "U").charAt(0).toUpperCase();

function ActivateTV() {
  const outlet = useOutletContext();
  const globalSearch = outlet?.search || "";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [connections, setConnections] = useState([]);

  const query = (search || globalSearch).trim();
  const debouncedQuery = useDebounce(query, 400);

  const fetchConnections = async (searchTerm = "", showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const response = await api.get("/admin/tv-connections", {
        params: searchTerm ? { search: searchTerm } : undefined
      });

      const apiConnections = Array.isArray(response?.data?.connections) ? response.data.connections : [];
      setConnections(apiConnections);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to fetch TV connected users.");
      setConnections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchConnections(debouncedQuery);
  }, [debouncedQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(connections.length / ITEMS_PER_PAGE));
  const pagedConnections = useMemo(() => paginate(connections, page, ITEMS_PER_PAGE), [connections, page]);

  const columns = [
    {
      key: "user",
      label: "User",
      render: (row) => {
        const user = row.user || {};

        return (
          <div className="flex items-center gap-3">
            {user.profilePic ? (
              <img src={user.profilePic} alt={user.fullName || user.mobile} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-500">
                {getInitial(user)}
              </div>
            )}
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{user.fullName || "Unnamed User"}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.mobile || "-"}</p>
            </div>
          </div>
        );
      }
    },
    { key: "email", label: "Email", render: (row) => row.user?.email || "-" },
    {
      key: "deviceName",
      label: "TV Device",
      render: (row) => (
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-300">
          <Tv size={13} />
          {row.deviceName || "TV device"}
        </span>
      )
    },
    {
      key: "profile",
      label: "Profile",
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs ${
            row.user?.isProfileComplete
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
              : "border border-amber-500/20 bg-amber-500/10 text-amber-500"
          }`}
        >
          {row.user?.isProfileComplete ? "Complete" : "Pending"}
        </span>
      )
    },
    {
      key: "connectedAt",
      label: "Connected On",
      render: (row) => formatDateTime(row.connectedAt)
    }
  ];

  return (
    <div>
      <PageHeader
        title="Activate TV"
        subtitle="Users whose account has been connected with a TV device."
        action={
          <button
            type="button"
            onClick={() => fetchConnections(debouncedQuery, true)}
            className="admin-toolbar-btn"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-500/10 p-2 text-indigo-500">
              <UserRound size={18} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Connected Users</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{connections.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-sky-500/10 p-2 text-sky-500">
              <Clock size={18} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Latest Connection</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {connections[0] ? formatDateTime(connections[0].connectedAt) : "No connected TV users yet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by user, email, mobile, or TV device" className="max-w-xl" />
      </div>

      {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

      {loading ? (
        <Loader />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={pagedConnections}
            emptyTitle="No TV connected users"
            emptyMessage="Users will appear here after a TV successfully logs in with an activation code."
            rowKey="_id"
          />

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <p>
              Showing {pagedConnections.length} of {connections.length} connected users
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="admin-page-btn"
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
                className="admin-page-btn"
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ActivateTV;
