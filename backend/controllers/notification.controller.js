const Notification = require("../models/notification.model");

// Get my notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications =
      await Notification.find({
        isActive: true,
        $or: [
          { targetUser: userId },
          { targetUser: null }
        ],
        "deletedBy.user": { $ne: userId }
      }).sort({ createdAt: -1 });

    const result = notifications.map((item) => {
      const obj = item.toObject();

      if (!obj.targetUser) {
        obj.isRead = item.readBy.some(
          (r) =>
            r.user.toString() ===
            userId.toString()
        );
      }

      return obj;
    });

    res.json({
      success: true,
      count: result.length,
      notifications: result
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
    const userId = req.user.userId;

    const notifications =
      await Notification.find({
        isActive: true,
        $or: [
          { targetUser: userId },
          { targetUser: null }
        ],
        "deletedBy.user": { $ne: userId }
      });

    let unreadCount = 0;

    notifications.forEach((item) => {
      if (item.targetUser) {
        if (!item.isRead) unreadCount++;
      } else {
        const read = item.readBy.some(
          (r) =>
            r.user.toString() ===
            userId.toString()
        );

        if (!read) unreadCount++;
      }
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark one as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notification =
      await Notification.findById(
        req.params.id
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    if (notification.targetUser) {
      notification.isRead = true;
      notification.readAt = new Date();
    } else {
      const exists =
        notification.readBy.some(
          (r) =>
            r.user.toString() ===
            userId.toString()
        );

      if (!exists) {
        notification.readBy.push({
          user: userId,
          readAt: new Date()
        });
      }
    }

    await notification.save();

    res.json({
      success: true,
      message: "Marked as read"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark all read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications =
      await Notification.find({
        isActive: true,
        $or: [
          { targetUser: userId },
          { targetUser: null }
        ]
      });

    for (const item of notifications) {
      if (item.targetUser) {
        item.isRead = true;
        item.readAt = new Date();
      } else {
        const exists =
          item.readBy.some(
            (r) =>
              r.user.toString() ===
              userId.toString()
          );

        if (!exists) {
          item.readBy.push({
            user: userId,
            readAt: new Date()
          });
        }
      }

      await item.save();
    }

    res.json({
      success: true,
      message: "All marked as read"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notification =
      await Notification.findById(
        req.params.id
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    if (notification.targetUser) {
      notification.isActive = false;
    } else {
      notification.deletedBy.push({
        user: userId,
        deletedAt: new Date()
      });
    }

    await notification.save();

    res.json({
      success: true,
      message: "Notification deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getReadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetUser: userId },
        { targetUser: null }
      ],
      "deletedBy.user": { $ne: userId }
    });

    let readCount = 0;

    notifications.forEach((item) => {
      if (item.targetUser) {
        if (item.isRead) readCount++;
      } else {
        const read = item.readBy.some(
          (r) => r.user.toString() === userId.toString()
        );

        if (read) readCount++;
      }
    });

    res.json({
      success: true,
      readCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};