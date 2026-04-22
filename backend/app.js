const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

//USER DELETE ITS ACCOUNT 
app.use("/api/user", require("./routes/user/account.routes"));

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
app.use("/api/admin/channels", require("./routes/admin/channel.routes"));

//user live channels
app.use("/api/channels", require("./routes/user/channel.routes"));

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

//Admin Plans
const planRoutes = require("./routes/admin/plan.routes");
app.use("/api/admin/plans", planRoutes);

// User Public Plans
const userPlanRoutes = require("./routes/user/plan.routes");
app.use("/api/plans", userPlanRoutes);

// User Subscriptions
const subscriptionRoutes = require("./routes/user/subscription.routes");
app.use("/api/subscriptions", subscriptionRoutes);

// Admin Subscriptions
const adminSubscriptionRoutes = require("./routes/admin/subscription.routes");
app.use("/api/admin/subscriptions", adminSubscriptionRoutes);
app.use("/api/payment", require("./routes/user/payment.routes"));

const adminLegalRoutes = require("./routes/admin/legal.routes");
const legalRoutes = require("./routes/user/legal.routes");

app.use("/api/admin/legal", adminLegalRoutes);
app.use("/api/legal", legalRoutes);

//notifications
app.use("/api/notifications", require("./routes/user/notification.routes"));
app.use("/api/admin/notifications", require("./routes/admin/notification.routes"));

//watchlist
app.use("/api/watchlist", require("./routes/user/watchlist.routes"));

module.exports = app;
