const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  sendNotification,
  getNotifications,
  deleteNotification,
  markAsRead,
  getUnreadCount
} = require("../../controllers/admin/notification.controller");

// Protected admin routes
router.use(isAdmin);

// Send push + store + image upload
router.post(
  "/send",
  upload.single("image"),
  sendNotification
);

// List all
router.get("/", getNotifications);

// Unread count
router.get("/unread-count", getUnreadCount);

// Mark read
router.patch("/:id/read", markAsRead);

// Delete
router.delete("/:id", deleteNotification);

module.exports = router;