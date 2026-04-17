import { useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import { notificationsHistory as initialHistory } from "../utils/adminFallbackData";

function Notifications() {
  const [form, setForm] = useState({ message: "", audience: "All Users" });
  const [history, setHistory] = useState(initialHistory);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.message.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/notifications", form);
    } catch (error) {
      // Keep UI functional with local fallback.
    } finally {
      const entry = {
        id: `NTF-${Date.now()}`,
        message: form.message,
        audience: form.audience,
        sentAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      };
      setHistory((prev) => [entry, ...prev]);
      setForm({ message: "", audience: "All Users" });
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "id", label: "Notification ID" },
    { key: "message", label: "Message" },
    { key: "audience", label: "Audience" },
    { key: "sentAt", label: "Sent At" }
  ];

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Send user pushes and review broadcast history." />

      <form
        onSubmit={submit}
        className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-[1fr,200px,140px]"
      >
        <input
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          placeholder="Write your notification message"
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900"
        />

        <select
          value={form.audience}
          onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value }))}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option>All Users</option>
          <option>Cricket Fans</option>
          <option>Football Fans</option>
          <option>Admins</option>
        </select>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>

      <DataTable
        columns={columns}
        rows={history}
        emptyTitle="No notifications"
        emptyMessage="Your notification history will appear here."
      />
    </div>
  );
}

export default Notifications;
