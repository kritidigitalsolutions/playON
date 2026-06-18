const { admin } = require("../config/firebase");

const sendNotification = async ({
  token,
  title,
  body,
  image = "",
  data = {}
}) => {
  try {
    const parsedData = Object.keys(data).reduce(
      (acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      },
      {}
    );

    // Ensure image is always present in data so client/OEM handlers can use it.
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
      data: parsedData
    };

    // Android rich notification image
    if (hasImage) {
      // Note: OEM support varies. Providing both imageUrl + image helps.
      // Also include a clickable action so some OEMs render rich content more reliably.
      message.android = {
        notification: {
          imageUrl: image,
          image: image,
          // Helps OEMs that only treat it as a “web”/rich notification.
          // (Safe even if your client ignores it.)
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
          // FCM Admin SDK also supports webLink; adding it for compatibility.
          webLink: image
        }
      };

      // iOS support
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

    return {
      success: true,
      response
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = sendNotification;