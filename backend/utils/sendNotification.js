const { admin } = require("../config/firebase");

const sendNotification = async ({
  token,
  title,
  body,
  data = {}
}) => {
  try {
    const message = {
      token,
      notification: {
        title,
        body
      },
      data: Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {})
    };

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