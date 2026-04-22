const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/admin.model");

const createFirstAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) return;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return;

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({ name, email, password: hashedPassword });
    console.log("First admin created successfully");
  } catch (error) {
    console.log("Admin seed error:", error.message);
  }
};

const connectDB = async () => {
  // Prevent multiple redundant connections on Vercel serverless cold starts
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected");
    await createFirstAdmin();
  } catch (error) {
    console.log("DB Error:", error.message);
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
};

module.exports = connectDB;