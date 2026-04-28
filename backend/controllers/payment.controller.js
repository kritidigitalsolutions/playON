const crypto = require("crypto");
const razorpay = require("../config/razorpay");

const Plan = require("../models/plan.model");
const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");
const PromoCode = require("../models/promoCode.model");
const PromoUsage = require("../models/promoUsage.model");

const promoService = require("../services/promoCode.service");

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const {
      planId,
      teamId,
      matchId,
      seriesId,
      promoCode
    } = req.body;

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

    if (
      plan.planType === "team_pass" &&
      !teamId
    ) {
      return res.status(400).json({
        success: false,
        message: "teamId is required"
      });
    }

    if (
      plan.planType === "match_pass" &&
      !matchId
    ) {
      return res.status(400).json({
        success: false,
        message: "matchId is required"
      });
    }

    if (
      plan.planType === "series_pass" &&
      !seriesId
    ) {
      return res.status(400).json({
        success: false,
        message: "seriesId is required"
      });
    }

    let payableAmount = plan.price;
    let discount = 0;
    let appliedPromo = null;

    if (promoCode) {
      const result =
        await promoService.validatePromo({
          code: promoCode,
          userId: req.user.userId,
          planId: plan._id,
          amount: plan.price
        });

      payableAmount = result.finalAmount;
      discount = result.discount;
      appliedPromo = result.promo.code;
    }

    const order = await razorpay.orders.create({
      amount: payableAmount * 100,
      currency: plan.currency || "INR",
      receipt: "plan_" + Date.now(),
      notes: {
        userId: req.user.userId,
        planId: plan._id.toString(),
        teamId: teamId || "",
        matchId: matchId || "",
        seriesId: seriesId || "",
        promoCode: appliedPromo || "",
        discount: discount || 0,
        finalAmount: payableAmount
      }
    });

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order: {
        id: order.id,
        amount: payableAmount,
        currency: plan.currency || "INR",
        receipt: order.receipt,
        status: order.status
      },
      plan,
      pricing: {
        originalAmount: plan.price,
        discount,
        finalAmount: payableAmount,
        promoCode: appliedPromo
      }
    });

  } catch (error) {
    res.status(400).json({
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
      planId,
      teamId,
      matchId,
      seriesId,
      promoCode
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
      generatedSignature !==
      razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    const userId = req.user.userId;

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

    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    let amountPaid = plan.price;
    let discount = 0;
    let appliedPromo = null;

    if (promoCode) {
      const result =
        await promoService.validatePromo({
          code: promoCode,
          userId,
          planId: plan._id,
          amount: plan.price
        });

      amountPaid = result.finalAmount;
      discount = result.discount;
      appliedPromo = result.promo.code;
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

        teamId: teamId || null,
        matchId: matchId || null,
        seriesId: seriesId || null,

        accessType: plan.planType,

        status: "active",
        startDate,
        endDate,
        amountPaid,
        paymentId: razorpay_payment_id,

        promoCode: appliedPromo || "",
        discountAmount: discount || 0
      });

    // Mark promo used after successful payment
    if (appliedPromo) {
      const promo =
        await PromoCode.findOne({
          code: appliedPromo
        });

      if (promo) {
        await PromoCode.findByIdAndUpdate(
          promo._id,
          {
            $inc: { usedCount: 1 }
          }
        );

        await PromoUsage.create({
          promoId: promo._id,
          userId,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id
        });
      }
    }

    // AD FREE LOGIC
    if (plan.planType === "ad_free") {
      const user = await User.findById(userId);

      if (user) {
        user.adsDisabled = true;

        if (plan.durationDays >= 99999) {
          user.adsExpiry = null;
          user.adFreePurchaseType = "lifetime";
        } else {
          const expiryDate = new Date();

          expiryDate.setDate(
            expiryDate.getDate() +
            plan.durationDays
          );

          user.adsExpiry = expiryDate;
          user.adFreePurchaseType =
            "temporary";
        }

        await user.save();
      }
    }

    res.json({
      success: true,
      message: "Payment verified",
      subscription
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};