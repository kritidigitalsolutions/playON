const { admin } = require("../config/firebase");

const sendNotification = async ({
  token,
  title,
  body,
  image = "",
  data = {},
  channelId = "default"
}) => {
  try {
    const parsedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key]);
      return acc;
    }, {});

    const hasImage = Boolean(image);
    if (hasImage) {
      parsedData.image = image;
    }

    const message = {
      token,
      notification: {
        title,
        body
      },
      data: parsedData,
      // ✅ ALWAYS set, regardless of image
      android: {
        notification: {
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
          channelId,
          ...(hasImage && { imageUrl: image })
        }
      }
    };

    // iOS only needed when there's an image
    if (hasImage) {
      message.apns = {
        payload: {
          aps: {
            mutableContent: true
          }
        },
        fcm_options: {
          image: image
        }
      };
    }

    const response = await admin.messaging().send(message);
    console.log("[FCM] ✅ success, messageId:", response);

    return { success: true, response };
  } catch (error) {
    console.error("[FCM] ❌ Error:", error.message, error.code);
    return { success: false, message: error.message };
  }
};

module.exports = sendNotification;