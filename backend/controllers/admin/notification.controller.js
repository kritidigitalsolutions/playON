const Notification = require("../../models/notification.model");
const User = require("../../models/user.model");
const sendNotification = require("../../utils/sendNotification");

// Send notification
exports.sendNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      sendTo,
      targetUser,
      metadata = {}
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required"
      });
    }

    const payload = {
      title,
      message,
      type: type || "GENERAL",
      metadata,
      createdBy: req.admin._id,
      sentAt: new Date()
    };

    let users = [];

    // Specific user
    if (sendTo === "SPECIFIC_USER" && targetUser) {
      payload.targetUser = targetUser;

      users = await User.find({
        _id: targetUser,
        fcmToken: { $ne: "" }
      });
    } else {
      // Broadcast
      payload.targetUser = null;

      users = await User.find({
        fcmToken: { $ne: "" },
        isDeleted: false
      });
    }

    const notification = await Notification.create(
      payload
    );

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const result = await sendNotification({
        token: user.fcmToken,
        title,
        body: message,
        data: {
          notificationId: notification._id,
          type: payload.type
        }
      });

      if (result.success) sent++;
      else failed++;
    }

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      notification,
      report: {
        totalUsers: users.length,
        sent,
        failed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications =
      await Notification.find()
        .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete / archive
exports.deleteNotification = async (req, res) => {
  try {
    const notification =
      await Notification.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification archived"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark read
exports.markAsRead = async (req, res) => {
  try {
    const notification =
      await Notification.findByIdAndUpdate(
        req.params.id,
        {
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const count =
      await Notification.countDocuments({
        isRead: false,
        isActive: true
      });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};