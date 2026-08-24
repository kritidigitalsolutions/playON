const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");

const {
  createOrder,
  verifyPayment,
  verifyApplePayment
} = require("../../controllers/payment.controller");

// Create Razorpay order
router.post("/create-order", isAuth, createOrder);

// Verify success payment
router.post("/verify", isAuth, verifyPayment);

// Verify Apple In-App Purchase payment
router.post("/apple-verify", isAuth, verifyApplePayment);

module.exports = router;