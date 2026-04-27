const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");

const {
  getMyNotifications,
  getUnreadCount,
  getReadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require("../../controllers/notification.controller");

const {
  saveFcmToken
} = require("../../controllers/user.controller");

// All routes protected
router.use(isAuth);

// Inbox
router.get("/",getMyNotifications);

// Badge count
router.get("/unread-count", getUnreadCount);
router.get("/read-count", getReadCount);

// Mark all read
router.patch("/read-all", markAllAsRead);

// Mark one read
router.patch("/:id/read", markAsRead);

// Delete one
router.delete("/:id", deleteNotification);

// Save device token
router.put("/fcm-token", saveFcmToken);

module.exports = router;