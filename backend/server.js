require("dotenv").config();
require("./config/firebase");

const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/user.model");

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    await connectDB();

    // Remove old unique index if it exists
    try {
      const indexes = await User.collection.indexes();

      const oldIndex = indexes.find(
        (item) => item.name === "mobile_1"
      );

      if (oldIndex) {
        await User.collection.dropIndex("mobile_1");
        console.log("Old mobile_1 index removed");
      }
    } catch (error) {
      console.log("Index check skipped:", error.message);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.log("Startup Error:", error.message);
    process.exit(1);
  }
};

startServer();