import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, Send, Trash2 } from "lucide-react";
import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";

const defaultForm = {
  title: "",
  message: "",
  type: "GENERAL",
  sendTo: "ALL_USERS",
  targetUser: "",
  actionUrl: ""
};

const notificationTypes = [
  "GENERAL",
  "MATCH",
  "STREAM",
  "CHANNEL",
  "PLAN",
  "SUBSCRIPTION",
  "SYSTEM",
  "PROMOTIONAL"
];

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function Notifications() {
  const [form, setForm] = useState(defaultForm);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastReport, setLastReport] = useState(null);

  const activeNotifications = useMemo(
    () => notifications.filter((item) => item.isActive !== false),
    [notifications]
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const [listResponse, countResponse] = await Promise.all([
        api.get("/admin/notifications"),
        api.get("/admin/notifications/unread-count")
      ]);

      setNotifications(Array.isArray(listResponse?.data?.notifications) ? listResponse.data.notifications : []);
      setUnreadCount(Number(countResponse?.data?.count) || 0);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to load notifications.");
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required.");
      return;
    }



    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      setLastReport(null);

      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        sendTo: form.sendTo,
        metadata: {}
      };



      if (form.actionUrl.trim()) {
        payload.metadata.actionUrl = form.actionUrl.trim();
      }

      const response = await api.post("/admin/notifications/send", payload);

      if (response?.data?.notification) {
        setNotifications((prev) => [response.data.notification, ...prev]);
      } else {
        await loadNotifications();
      }

      setLastReport(response?.data?.report || null);
      setSuccess(response?.data?.message || "Notification sent successfully.");
      setForm(defaultForm);

      const countResponse = await api.get("/admin/notifications/unread-count");
      setUnreadCount(Number(countResponse?.data?.count) || 0);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to send notification.");
    } finally {
      setSubmitting(false);
    }
  };

  const markAsRead = async (notification) => {
    if (!notification?._id) return;

    try {
      setActionId(notification._id);
      setError("");

      const response = await api.patch(`/admin/notifications/${notification._id}/read`);
      const updated = response?.data?.notification;

      if (updated?._id) {
        setNotifications((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      }

      setUnreadCount((prev) => Math.max(0, prev - (notification.isRead ? 0 : 1)));
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to mark notification as read.");
    } finally {
      setActionId("");
    }
  };

  const deleteNotification = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleting(true);
      setError("");

      await api.delete(`/admin/notifications/${deleteTarget._id}`);
      setNotifications((prev) => prev.map((item) => (
        item._id === deleteTarget._id ? { ...item, isActive: false } : item
      )));
      setDeleteTarget(null);

      if (!deleteTarget.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete notification.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "title",
      label: "Notification",
      render: (row) => (
        <div className="max-w-md">
          <p className="font-medium text-slate-900 dark:text-slate-100">{row.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{row.message}</p>
        </div>
      )
    },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-500">
          {row.type || "GENERAL"}
        </span>
      )
    },
    {
      key: "targetUser",
      label: "Audience",
      render: (row) => (row.targetUser ? "Specific User" : "All Users")
    },
    {
      key: "isRead",
      label: "Status",
      render: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs ${
          row.isRead
            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            : "border border-amber-500/20 bg-amber-500/10 text-amber-500"
        }`}
        >
          {row.isRead ? "Read" : "Unread"}
        </span>
      )
    },
    { key: "sentAt", label: "Sent At", render: (row) => formatDate(row.sentAt || row.createdAt) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => markAsRead(row)}
            disabled={row.isRead || actionId === row._id}
            className="admin-action-btn-success"
          >
            <Check size={13} /> Read
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="admin-action-btn-danger-sm"
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
        title="Notifications"
        subtitle="Send user push notifications and manage notification history."
        action={
          <button
            type="button"
            onClick={loadNotifications}
            className="admin-toolbar-btn"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {error ? <p className="mb-3 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p> : null}
      {success ? <p className="mb-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-500">{success}</p> : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{activeNotifications.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Unread</p>
          <p className="mt-2 text-2xl font-semibold text-amber-500">{unreadCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Last Sent</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(activeNotifications[0]?.sentAt || activeNotifications[0]?.createdAt)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Last Report</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {lastReport ? `${lastReport.sent} sent / ${lastReport.failed} failed` : "-"}
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Title</span>
            <input
              value={form.title}
              onChange={(event) => onFormChange("title", event.target.value)}
              placeholder="Notification title"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Type</span>
            <select
              value={form.type}
              onChange={(event) => onFormChange("type", event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {notificationTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>



          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Action URL</span>
            <input
              value={form.actionUrl}
              onChange={(event) => onFormChange("actionUrl", event.target.value)}
              placeholder="Optional deep link or route"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-slate-500 dark:text-slate-400">Message</span>
            <textarea
              rows="4"
              value={form.message}
              onChange={(event) => onFormChange("message", event.target.value)}
              placeholder="Write your notification message"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <Send size={15} /> {submitting ? "Sending..." : "Send Notification"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Loading notifications...
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={activeNotifications}
          rowKey="_id"
          emptyTitle="No notifications"
          emptyMessage="Sent notification history will appear here."
        />
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete notification?"
        message={`This will delete "${deleteTarget?.title || "this notification"}" from the admin history.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteNotification}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
      />
    </div>
  );
}

export default Notifications;
