const express = require("express");
const router = express.Router();

const {
  loginAdmin,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword
} = require("../../controllers/admin auth/admin.auth.controller");

const {
  getAllUsers,
  deleteUserById
} = require("../../controllers/admin/users.admin.controller");

const {
  getTvConnections
} = require("../../controllers/admin/tv.admin.controller");

const {
  sendPasswordOtp,
  changePassword,
  sendEmailOtp,
  changeEmail
} = require("../../controllers/admin auth/admin.settings.controller");

const {
  getDashboard
} = require("../../controllers/admin/dashboard.controller");

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");

// Public Auth
router.post("/login", loginAdmin);
router.post("/forgot-password/send-otp", sendForgotPasswordOtp);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp);
router.post("/forgot-password/reset", resetForgotPassword);

// Dashboard
router.get(
  "/dashboard",
  isAdmin,
  hasPermission("users", "view"),
  getDashboard
);

// Users
router.get(
  "/users",
  isAdmin,
  hasPermission("users", "view"),
  getAllUsers
);

router.delete(
  "/users/:id",
  isAdmin,
  hasPermission("users", "delete"),
  deleteUserById
);

// TV Connections
router.get(
  "/tv-connections",
  isAdmin,
  hasPermission("users", "view"),
  getTvConnections
);

// Settings (self account actions)
router.post("/send-password-otp", isAdmin, sendPasswordOtp);
router.post("/change-password", isAdmin, changePassword);
router.post("/send-email-otp", isAdmin, sendEmailOtp);
router.post("/change-email", isAdmin, changeEmail);

module.exports = router;