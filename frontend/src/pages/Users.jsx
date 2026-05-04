import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Trash2, X } from "lucide-react";
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

const isDeletedProfile = (user) => user?.accountStatus === "deleted" || user?.isDeleted;

const getProfileStatus = (user) => {
  if (isDeletedProfile(user)) {
    return {
      label: "Deleted",
      className: "border border-rose-500/20 bg-rose-500/10 text-rose-500"
    };
  }

  if (user?.isProfileComplete) {
    return {
      label: "Complete",
      className: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
    };
  }

  return {
    label: "Pending",
    className: "border border-amber-500/20 bg-amber-500/10 text-amber-500"
  };
};

const getDeleteReason = (user) => {
  return user?.deleteReason || user?.deletionReason || user?.deletedReason || user?.reason || "-";
};

function Users() {
  const outlet = useOutletContext();
  const globalSearch = outlet?.search || "";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const query = (search || globalSearch).trim();
  const debouncedQuery = useDebounce(query, 400);

  const fetchUsers = async (searchTerm = "") => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/users", {
        params: searchTerm ? { search: searchTerm } : undefined
      });

      const apiUsers = Array.isArray(response?.data?.users) ? response.data.users : [];
      setUsers(apiUsers);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to fetch users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(debouncedQuery);
  }, [debouncedQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
  const pagedUsers = useMemo(() => paginate(users, page, ITEMS_PER_PAGE), [users, page]);
  const selectedUserStatus = getProfileStatus(selectedUser);
  const selectedUserDeleted = isDeletedProfile(selectedUser);

  const handleDeleteUser = async () => {
    if (!userToDelete?._id) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/admin/users/${userToDelete._id}`);
      setUsers((prev) => prev.filter((user) => user._id !== userToDelete._id));
      setUserToDelete(null);
      if (selectedUser?._id === userToDelete._id) {
        setSelectedUser(null);
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "profile",
      label: "User",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.profilePic ? (
            <img 
              src={row.profilePic} 
              alt={row.fullName || row.mobile} 
              className="h-9 w-9 rounded-full object-cover" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-500">
              {(row.fullName || row.mobile || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{row.fullName || "Unnamed User"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.mobile || "-"}</p>
          </div>
        </div>
      )
    },
    { key: "email", label: "Email", render: (row) => row.email || "-" },
    {
      key: "isProfileComplete",
      label: "Profile",
      render: (row) => {
        const status = getProfileStatus(row);

        return (
          <span className={`rounded-full px-2.5 py-1 text-xs ${status.className}`}>
            {status.label}
          </span>
        );
      }
    },
    {
      key: "favoriteSports",
      label: "Sports",
      render: (row) => (row.favoriteSports?.length ? row.favoriteSports.join(", ") : "-")
    },
    { key: "createdAt", label: "Joined", render: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        return (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedUser(row)}
              className="admin-action-btn-sm"
            >
              <Eye size={13} /> 
            </button>
            <button
              type="button"
              onClick={() => setUserToDelete(row)}
              className="admin-action-btn-danger-sm"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle="View and manage all registered users." />

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by full name, email, or mobile" className="max-w-lg" />
      </div>

      {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

      {loading ? (
        <Loader />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={pagedUsers}
            emptyTitle="No users found"
            emptyMessage="Try a different search keyword."
            rowKey="_id"
          />

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <p>
              Showing {pagedUsers.length} of {users.length} users
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

      <AnimatePresence>
        {selectedUser ? (
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
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
            >
              <div className="mb-4 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">User Details</h3>
                <button type="button" onClick={() => setSelectedUser(null)} className="text-slate-500">
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                {selectedUser.profilePic ? (
                  <img 
                    src={selectedUser.profilePic} 
                    alt={selectedUser.fullName || "User"} 
                    className="h-16 w-16 rounded-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-semibold text-indigo-500">
                    {(selectedUser.fullName || selectedUser.mobile || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{selectedUser.fullName || "Unnamed User"}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.email || "No email"}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-xl p-3">
                  <p className="text-slate-500 dark:text-slate-400">Mobile</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{selectedUser.mobile || "-"}</p>
                </div>
                <div className="rounded-xl p-3">
                  <p className="text-slate-500 dark:text-slate-400">Favorite Sports</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {selectedUser.favoriteSports?.length ? selectedUser.favoriteSports.join(", ") : "-"}
                  </p>
                </div>
                <div className="rounded-xl p-3">
                  <p className="text-slate-500 dark:text-slate-400">Profile Status</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs ${selectedUserStatus.className}`}>
                    {selectedUserStatus.label}
                  </span>
                </div>
                {selectedUserDeleted ? (
                  <>
                    <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
                      <p className="text-rose-600 dark:text-rose-300">Deletion Reason</p>
                      <p className="mt-1 whitespace-pre-wrap font-medium text-slate-800 dark:text-slate-100">
                        {getDeleteReason(selectedUser)}
                      </p>
                    </div>
                    <div className="rounded-xl p-3">
                      <p className="text-slate-500 dark:text-slate-400">Deleted On</p>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{formatDate(selectedUser.deletedAt)}</p>
                    </div>
                  </>
                ) : null}
                <div className="rounded-xl p-3">
                  <p className="text-slate-500 dark:text-slate-400">Joined On</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        open={Boolean(userToDelete)}
        title="Delete this user?"
        message={`This action will permanently remove ${userToDelete?.fullName || userToDelete?.mobile || "this user"}.`}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        confirmLabel={deleting ? "Deleting..." : "Delete User"}
      />
    </div>
  );
}

export default Users;
