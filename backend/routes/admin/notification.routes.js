const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");

const {
  sendNotification,
  getNotifications,
  deleteNotification,
  markAsRead,
  getUnreadCount
} = require("../../controllers/admin/notification.controller");

// Protected admin routes
router.use(isAdmin);

// Send push + store
router.post("/send", sendNotification);

// List all
router.get("/", getNotifications);

// Unread count
router.get("/unread-count", getUnreadCount);

// Mark read
router.patch("/:id/read", markAsRead);

// Archive
router.delete("/:id", deleteNotification);

module.exports = router;
