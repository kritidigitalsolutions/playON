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
    const payload = {
      title,
      message,
      type,
      metadata,
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
      await sendNotification({
        token: user.fcmToken,
        title,
        body: message,
        data: {
          notificationId: notification._id,
          type
        }
      });
    }

    return { success: true };
  } catch (error) {
    console.log("Auto Notify Error:", error.message);
    return { success: false };
  }
};

module.exports = autoNotify;