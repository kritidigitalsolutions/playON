const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const sendNotification = require("./sendNotification");

const autoNotify = async ({
  title,
  message,
  type = "GENERAL",
  metadata = {},
  targetUser = null
}) => {
  try {
    const notificationData = Object.entries(metadata || {}).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    const payload = {
      title,
      message,
      type,
      metadata: notificationData,
      targetUser,
      sentAt: new Date(),
      isActive: true
    };

    const notification = await Notification.create(payload);

    let usersQuery = {
      fcmToken: { $ne: "" },
      isDeleted: false
    };

    if (targetUser) {
      usersQuery._id = targetUser;
    }

    const users = await User.find(usersQuery);

    for (const user of users) {
      const result = await sendNotification({
        token: user.fcmToken,
        title,
        body: message,
        image: metadata?.image || "",
        data: {
          notificationId: notification._id,
          type,
          ...notificationData
        }
      });

      // Helpful per-device logging for OEM-specific rich-image issues.
      if (!result?.success) {
        console.log('[FCM] send failed', {
          userId: user._id?.toString?.() || user._id,
          hasImage: Boolean(metadata?.image),
          image: metadata?.image || '',
          fcmTokenPrefix: (user.fcmToken || '').slice(0, 10),
          error: result?.message
        });
      } else {
        console.log('[FCM] send ok', {
          userId: user._id?.toString?.() || user._id,
          hasImage: Boolean(metadata?.image),
          fcmTokenPrefix: (user.fcmToken || '').slice(0, 10)
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.log("Auto Notify Error:", error.message);
    return { success: false };
  }
};

module.exports = autoNotify;
