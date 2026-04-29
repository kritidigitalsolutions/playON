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

    if (image) {
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
    if (image) {
      message.android = {
  notification: {
    imageUrl: image,
    image: image
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

    const response = await admin
      .messaging()
      .send(message);

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