const express = require("express");
const router = express.Router();

const {
  sendOtp,
  verifyOtp,
  googleLogin,
  appleLogin
} = require("../../controllers/auth.controller");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.post("/google/login", googleLogin);
router.post("/apple/login", appleLogin);

module.exports = router;