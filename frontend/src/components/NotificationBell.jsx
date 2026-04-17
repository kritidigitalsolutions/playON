import { Bell, Dot } from "lucide-react";
import { motion } from "framer-motion";

function NotificationBell({ items = [] }) {
  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-xl border border-slate-200 bg-white/80 p-2.5 text-slate-600 shadow-sm transition hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {items.length > 0 && <Dot className="absolute -right-2 -top-2 text-rose-500" size={24} />}
      </button>

      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 z-20 mt-2 hidden w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl group-hover:block dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">{items[0]?.text}</p>
        </motion.div>
      )}
    </div>
  );
}

export default NotificationBell;
