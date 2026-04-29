const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  sendNotification,
  getNotifications,
  deleteNotification,
  markAsRead,
  getUnreadCount
} = require("../../controllers/admin/notification.controller");

// Send push + store + image upload
router.post(
  "/send",
  isAdmin,
  hasPermission("notifications", "create"),
  upload.single("image"),
  sendNotification
);

// List all
router.get(
  "/",
  isAdmin,
  hasPermission("notifications", "view"),
  getNotifications
);

// Unread count
router.get(
  "/unread-count",
  isAdmin,
  hasPermission("notifications", "view"),
  getUnreadCount
);

// Mark read
router.patch(
  "/:id/read",
  isAdmin,
  hasPermission("notifications", "edit"),
  markAsRead
);

// Delete
router.delete(
  "/:id",
  isAdmin,
  hasPermission("notifications", "delete"),
  deleteNotification
);

module.exports = router;