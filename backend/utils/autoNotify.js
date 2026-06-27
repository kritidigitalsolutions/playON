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
    console.log("[NOTIFY] Called with:", { title, type, metadata });

    // 🔍 DEBUG: confirm exactly what image value is present before anything touches it
    console.log(
      "[NOTIFY] image value being passed to sendNotification:",
      metadata?.image,
      "| type:",
      typeof metadata?.image
    );

    const notificationData = Object.entries(metadata || {}).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = String(value); // ← fix ObjectId stringify here too
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
    console.log("[NOTIFY] Notification saved to DB:", notification._id);

    let usersQuery = {
      fcmToken: { $ne: "" },
      isDeleted: false
    };

    if (targetUser) usersQuery._id = targetUser;

    const users = await User.find(usersQuery);
    console.log("[NOTIFY] Users with FCM token:", users.length);

    if (users.length === 0) {
      console.warn("[NOTIFY] ⚠️ No users found with FCM token — notifications won't send");
    }

    for (const user of users) {
      console.log("[NOTIFY] Sending to user:", user._id, "token prefix:", user.fcmToken?.slice(0, 20));

      // 🔍 DEBUG: confirm the exact image string going into sendNotification for THIS user/call
      console.log("[NOTIFY] -> sendNotification image param:", metadata?.image || "(empty)");

      const result = await sendNotification({
        token: user.fcmToken,
        title,
        body: message,
        image: metadata?.image || "",
        data: {
          notificationId: String(notification._id),
          type,
          actionUrl: String(notificationData.actionUrl || ""),
          image: String(metadata?.image || ""),
          ...notificationData
        },
        badge: 1,
        sound: "default",
        channelId: "default"
      });

      if (!result?.success) {
        console.error("[NOTIFY] ❌ FCM failed for user:", user._id, "error:", result?.message);
      } else {
        console.log("[NOTIFY] ✅ FCM success for user:", user._id);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[NOTIFY] ❌ Fatal error:", error.message, error.stack);
    return { success: false };
  }
};
module.exports = autoNotify;