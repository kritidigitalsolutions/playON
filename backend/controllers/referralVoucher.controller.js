const PromoCode = require("../models/promoCode.model");

// =======================
// GET REFERRAL OFFER (PUBLIC)
// =======================
exports.getReferralOffer = async (req, res) => {
  try {
    const now = new Date();

    const offers = await PromoCode.find({
      isActive: true,
      isReferral: true, // 🔥 Must be marked as referral offer
      assignedTo: null, // 🔥 GLOBAL PROMO
      $and: [
        {
          $or: [
            { validFrom: { $lte: now } },
            { validFrom: null }
          ]
        },
        {
          $or: [
            { validTill: { $gt: now } },
            { validTill: null }
          ]
        }
      ]
    })
    .select("title discountType discountValue maxDiscount validTill")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: offers.length,
      offers
    });

  } catch (error) {
    console.error("Referral Offer Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch referral offers"
    });
  }
};

// =======================
// GET REFERRAL VOUCHERS
// =======================
exports.getReferralVouchers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const vouchers = await PromoCode.find({
      assignedTo: userId,
      isReferral: { $ne: true }, // 🔥 Only show earned rewards, not templates
      isActive: true,
      $and: [
        // ✅ start date check
        {
          $or: [
            { validFrom: { $lte: now } },
            { validFrom: null }
          ]
        },
        // ✅ expiry check
        {
          $or: [
            { validTill: { $gt: now } },
            { validTill: null }
          ]
        },
        // ✅ usage check
        {
          $or: [
            { usageLimit: 0 }, // unlimited
            { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
          ]
        }
      ]
    })
    .select(
      "code title discountType discountValue maxDiscount validFrom validTill usageLimit usedCount"
    )
    .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: vouchers.length,
      vouchers
    });

  } catch (error) {
    console.error("Referral Voucher Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vouchers"
    });
  }
};