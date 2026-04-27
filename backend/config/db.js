const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/admin.model");

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = {
    conn: null,
    promise: null,
    seeded: false
  };
}

const createFirstAdmin = async () => {
  if (cached.seeded) return;

  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) return;

  const existingAdmin = await Admin.findOne({
    email: email.toLowerCase()
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    console.log("First admin created");
  }

  cached.seeded = true;
};

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(
      process.env.MONGO_URI,
      {
        serverSelectionTimeoutMS: 10000,
        bufferCommands: false
      }
    );
  }

  cached.conn = await cached.promise;

  await createFirstAdmin();

  return cached.conn;
};

module.exports = connectDB;