const Notification = require("../../models/notification.model");
const User = require("../../models/user.model");
const sendNotification = require("../../utils/sendNotification");
const uploadToFirebase = require("../../utils/uploadToFirebase");
const deleteFromFirebase = require("../../utils/deleteFromFirebase");


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

    let image = "";

if (req.file) {
  image = await uploadToFirebase(
    req.file,
    "notifications"
  );
}

  const payload = {
  title,
  message,
  type: type || "GENERAL",
  metadata: {
    ...metadata,
    image
  },
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
    const notifications = await Notification.find()
      .sort({ createdAt: -1 });

    const formatted = notifications.map((item) => {
      const obj = item.toObject();

      return {
        ...obj,
        image: obj.metadata?.image || ""
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      notifications: formatted
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
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    if (notification.metadata?.image) {
      await deleteFromFirebase(notification.metadata.image);
    }

    await Notification.findByIdAndDelete(req.params.id);


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