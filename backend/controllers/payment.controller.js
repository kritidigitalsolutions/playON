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
    console.error("CREATE ORDER ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Payment + Create Subscription
exports.verifyPayment = async (req, res) => {
  // 🔑 Track whether res.json() has already been sent,
  // so side-effect errors below never try to send a second response.
  let responseSent = false;

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

    // =========================
    // STEP 1: BASIC VALIDATION
    // =========================
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

    // =========================
    // STEP 2: SIGNATURE CHECK
    // =========================
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        razorpay_order_id + "|" + razorpay_payment_id
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    const userId = req.user.userId;

    // =========================
    // STEP 3: IDEMPOTENCY CHECK
    // =========================
    const alreadyExists = await Subscription.findOne({
      paymentId: razorpay_payment_id
    });

    if (alreadyExists) {
      return res.json({
        success: true,
        message: "Already processed",
        subscription: alreadyExists
      });
    }

    // =========================
    // STEP 4: PLAN CHECK
    // =========================
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
      try {
        const result = await promoService.validatePromo({
          code: promoCode,
          userId,
          planId: plan._id,
          amount: plan.price
        });

        amountPaid = result.finalAmount;
        discount = result.discount;
        appliedPromo = result.promo.code;
      } catch (promoError) {
        // Promo validation failing AFTER payment is already captured
        // should NOT block subscription creation. Log it and proceed
        // with full price — payment ka paisa already Razorpay le chuka hai.
        console.error(
          "PROMO VALIDATION FAILED (post-payment, proceeding without promo):",
          promoError.message
        );
        appliedPromo = null;
        discount = 0;
        amountPaid = plan.price;
      }
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // =========================
    // STEP 5: CREATE SUBSCRIPTION (critical — must succeed)
    // =========================
    const subscription = await Subscription.create({
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

    // =========================
    // ✅ SEND SUCCESS RESPONSE NOW
    // Subscription is saved — user MUST get their plan confirmed,
    // regardless of what happens in the side-effects below.
    // =========================
    res.json({
      success: true,
      message: "Payment verified",
      subscription
    });
    responseSent = true;

    // =========================
    // STEP 6: SIDE EFFECTS (non-blocking, isolated)
    // Each block has its own try/catch so one failing
    // doesn't affect the others or the already-sent response.
    // =========================

    // --- Ad-free logic ---
    let userForAdFree = null;
    try {
      if (plan.planType === "ad_free") {
        userForAdFree = await User.findById(userId);

        if (userForAdFree) {
          userForAdFree.adsDisabled = true;

          if (plan.durationDays >= 99999) {
            userForAdFree.adsExpiry = null;
            userForAdFree.adFreePurchaseType = "lifetime";
          } else {
            const expiryDate = new Date();
            expiryDate.setDate(
              expiryDate.getDate() + plan.durationDays
            );

            userForAdFree.adsExpiry = expiryDate;
            userForAdFree.adFreePurchaseType = "temporary";
          }

          await userForAdFree.save();
        }
      }
    } catch (adFreeError) {
      console.error(
        "AD-FREE UPDATE ERROR (non-blocking) for paymentId",
        razorpay_payment_id,
        ":",
        adFreeError
      );
    }

    // --- Referral reward logic ---
    try {
      const user =
        userForAdFree || (await User.findById(userId));

      if (
        user &&
        user.referredBy &&
        !user.hasCompletedReferralReward
      ) {
        const { rewardReferrer } = require("../utils/referralReward");

        await rewardReferrer(user.referredBy);

        user.hasCompletedReferralReward = true;
        await user.save();
      }
    } catch (referralError) {
      console.error(
        "REFERRAL REWARD ERROR (non-blocking) for paymentId",
        razorpay_payment_id,
        ":",
        referralError
      );
    }

    // --- Promo usage tracking ---
    try {
      if (appliedPromo) {
        const promo = await PromoCode.findOne({
          code: appliedPromo
        });

        if (promo) {
          await PromoCode.findByIdAndUpdate(promo._id, {
            $inc: { usedCount: 1 }
          });

          await PromoUsage.create({
            promoId: promo._id,
            userId,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id
          });
        }
      }
    } catch (promoUsageError) {
      console.error(
        "PROMO USAGE TRACKING ERROR (non-blocking) for paymentId",
        razorpay_payment_id,
        ":",
        promoUsageError
      );
    }

  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    // Agar response already ja chuka hai (side-effect phase mein error aaya),
    // to dubara res.json() call nahi karna — warna
    // "Cannot set headers after they are sent" crash hoga.
    if (!responseSent) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};