const express = require("express");
const router = express.Router();

const {
  loginAdmin,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword
} = require("../../controllers/admin auth/admin.auth.controller");
const { getAllUsers, deleteUserById } = require("../../controllers/admin/users.admin.controller");
const { isAdmin } = require("../../middlewares/admin.middleware");

const {
  sendPasswordOtp,
  changePassword,
  sendEmailOtp,
  changeEmail
} = require("../../controllers/admin auth/admin.settings.controller");
const { getDashboard } = require("../../controllers/admin/dashboard.controller");

router.post("/login", loginAdmin);
router.post("/forgot-password/send-otp", sendForgotPasswordOtp);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp);
router.post("/forgot-password/reset", resetForgotPassword);
router.get("/users", isAdmin, getAllUsers);
router.delete("/users/:id", isAdmin, deleteUserById);

router.get("/dashboard", isAdmin, getDashboard);

//Admin settings page
router.post("/send-password-otp", isAdmin, sendPasswordOtp);
router.post("/change-password", isAdmin, changePassword);

router.post("/send-email-otp", isAdmin, sendEmailOtp);
router.post("/change-email", isAdmin, changeEmail);

module.exports = router;
