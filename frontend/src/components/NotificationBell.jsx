import { useEffect, useRef, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";

function timeAgo(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/admin/notifications/unread-count");
      // Handle various common response structures
      const count = res.data?.count ?? res.data?.unreadCount ?? res.data ?? 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/notifications");
      const data = res.data?.data ?? res.data?.notifications ?? res.data ?? [];
      const unreadData = (Array.isArray(data) ? data : []).filter((n) => !n.isRead);
      setNotifications(unreadData);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id, currentReadStatus) => {
    if (currentReadStatus) return;
    try {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      
      await api.patch(`/admin/notifications/${id}/read`);
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="relative rounded-xl border border-slate-200 bg-white/80 p-2.5 text-slate-600 shadow-sm transition hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-50 mt-3 w-80 sm:w-96 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Loader2 className="mb-2 h-6 w-6 animate-spin text-indigo-500" />
                  <p className="text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Bell className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id || Math.random()}
                      onClick={() => markAsRead(notification._id, notification.isRead)}
                      className={`relative flex gap-3 cursor-pointer rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        !notification.isRead ? "bg-indigo-50/30 dark:bg-indigo-500/5" : ""
                      }`}
                    >
                      <div className="mt-1 shrink-0">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            !notification.isRead
                              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <Bell size={14} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        {notification.title && (
                          <p className={`truncate text-sm font-semibold ${!notification.isRead ? "text-slate-800 dark:text-slate-200" : "text-slate-700 dark:text-slate-300"}`}>
                            {notification.title}
                          </p>
                        )}
                        <p
                          className={`text-sm ${
                            !notification.title && !notification.isRead
                              ? "font-medium text-slate-800 dark:text-slate-200"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {notification.message}
                        </p>
                        {notification.createdAt && (
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {timeAgo(notification.createdAt)}
                          </p>
                        )}
                      </div>
                      {!notification.isRead && (
                        <div className="flex shrink-0 items-center justify-center pl-2">
                          <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-100 p-2 dark:border-slate-800">
              <button
                type="button"
                className="w-full rounded-lg px-4 py-2 text-center text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
