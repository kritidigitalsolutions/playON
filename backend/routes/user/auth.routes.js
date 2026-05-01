const express = require("express");
const router = express.Router();

const {
  sendOtp,
  verifyOtp,
  googleLogin
} = require("../../controllers/auth.controller");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.post("/google/login", googleLogin);

module.exports = router;