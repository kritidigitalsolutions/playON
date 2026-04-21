const crypto = require("crypto");
const razorpay = require("../config/razorpay");

const Plan = require("../models/plan.model");
const Subscription = require("../models/subscription.model");

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required"
      });
    }

    const plan = await Plan.findById(planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: plan.currency || "INR",
      receipt: "plan_" + Date.now(),
      notes: {
        userId: req.user.userId,
        planId: plan._id.toString()
      }
    });

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order,
      plan
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Payment + Create Subscription
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !planId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment fields"
      });
    }

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        razorpay_order_id +
          "|" +
          razorpay_payment_id
      )
      .digest("hex");

    if (
      generatedSignature !== razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    const userId = req.user.userId;

    // prevent duplicate payment
    const alreadyExists =
      await Subscription.findOne({
        paymentId: razorpay_payment_id
      });

    if (alreadyExists) {
      return res.json({
        success: true,
        message: "Already processed",
        subscription: alreadyExists
      });
    }

    // block second active plan
    const active =
      await Subscription.findOne({
        userId,
        status: "active",
        endDate: { $gt: new Date() }
      });

    if (active) {
      return res.status(400).json({
        success: false,
        message:
          "You already have an active subscription"
      });
    }

    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    const startDate = new Date();
    const endDate = new Date();

    endDate.setDate(
      endDate.getDate() + plan.durationDays
    );

    const subscription =
      await Subscription.create({
        userId,
        planId: plan._id,
        status: "active",
        startDate,
        endDate,
        amountPaid: plan.price,
        paymentId: razorpay_payment_id
      });

    res.json({
      success: true,
      message: "Payment verified",
      subscription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};