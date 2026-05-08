require("dotenv").config();
require("./config/firebase");

const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/user.model");

const PORT = process.env.PORT || 8000;

const init = async () => {
  await connectDB();


  try {
    const indexes = await User.collection.indexes();

    const oldMobile = indexes.find(
      (item) => item.name === "mobile_1"
    );

    const oldEmail = indexes.find(
      (item) => item.name === "email_1"
    );

    if (oldMobile) {
      await User.collection.dropIndex("mobile_1");
      console.log("Old mobile_1 index removed");
    }

    if (oldEmail) {
      await User.collection.dropIndex("email_1");
      console.log("Old email_1 index removed");
    }

    await User.syncIndexes();
    console.log("Indexes synced");

  } catch (error) {
    console.log("Index check skipped:", error.message);
  }
};

let initPromise = init();

if (!process.env.VERCEL) {
  initPromise
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `Server running on port ${PORT}`
        );
      });
    })
    .catch((error) => {
      console.log(
        "Startup Error:",
        error.message
      );
      process.exit(1);
    });
}

module.exports = async (req, res) => {
  await initPromise;
  return app(req, res);
};