const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");

const Admin = require("./models/admin.model");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Create First Admin Automatically
const createFirstAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      console.log("Admin env variables missing");
      return;
    }

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
        // console.log(name);
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      name,
      email,
      password: hashedPassword
    });

    console.log("First admin created successfully");

  } catch (error) {
    console.log("Admin seed error:", error.message);
  }
};

// Run seed function
createFirstAdmin();


// Test Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running"
  });
});


// Routes
app.use("/api/auth", require("./routes/user/auth.routes"));
app.use("/api/user", require("./routes/user/user.routes"));
app.use("/api/admin", require("./routes/admin/admin.routes"));


//Admin match routes 
const matchRoutes = require("./routes/admin/match.routes");

app.use("/api/admin/matches", matchRoutes);


//user match routes
const matchUserRoutes = require("./routes/user/match.routes");

app.use("/api/matches", matchUserRoutes);

//admin stream routes
const adminStreamRoutes = require("./routes/admin/stream.routes");

app.use("/api/admin/streams", adminStreamRoutes);

//user stream routes
const streamRoutes = require("./routes/user/stream.routes");
app.use("/api/streams", streamRoutes);

//live channels admin

app.use("/api/admin/channels",require("./routes/admin/channel.routes"));


//user live channels
app.use("/api/channels",require("./routes/user/channel.routes"));

// Admin players
app.use(
  "/api/admin/players",
  require("./routes/admin/player.routes")
);

// User players
app.use(
  "/api/players",
  require("./routes/user/player.routes")
);

module.exports = app;