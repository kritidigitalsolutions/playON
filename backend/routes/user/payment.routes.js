const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");

const {
  createOrder,
  verifyPayment
} = require("../../controllers/payment.controller");

// Create Razorpay order
router.post("/create-order", isAuth, createOrder);

// Verify success payment
router.post("/verify", isAuth, verifyPayment);

module.exports = router;