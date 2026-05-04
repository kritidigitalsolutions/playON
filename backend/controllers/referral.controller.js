const User = require("../models/user.model");
const PromoCode = require("../models/promoCode.model");

// =======================
// 🔑 GENERATE CODE
// =======================
const generateReferralCode = () => {
  return "REF" + Math.random().toString(36).slice(2, 8).toUpperCase();
};

// =======================
// 🔒 UNIQUE CODE (SAFE)
// =======================
const getUniqueReferralCode = async () => {
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode();

    const exists = await User.exists({ referralCode: code });

    if (!exists) return code;
  }

  throw new Error("Failed to generate unique referral code");
};

// =======================
// GET MY REFERRAL CODE
// =======================
exports.getMyReferralCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("referralCode");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.referralCode) {
      user.referralCode = await getUniqueReferralCode();
      await user.save();
    }

    res.json({
      success: true,
      referralCode: user.referralCode
    });

  } catch (error) {
    console.error("Referral Code Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch referral code"
    });
  }
};

// =======================
// REFERRAL DASHBOARD
// =======================
exports.getReferralDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select("referralCode referralCount hasCompletedReferralReward");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const rewards = await PromoCode.find({
      assignedTo: userId
    }).select("code discountType discountValue validTill usedCount");

    const totalRewards = rewards.length;

    const activeRewards = await PromoCode.countDocuments({
      assignedTo: userId,
      $or: [
        { validTill: { $gt: new Date() } },
        { validTill: null }
      ]
    });

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        hasEarnedReward: user.hasCompletedReferralReward,
        totalRewards,
        activeRewards,
        rewards
      }
    });

  } catch (error) {
    console.error("Referral Dashboard Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to load referral dashboard"
    });
  }
};