const PromoCode = require("../models/promoCode.model");

exports.getAvailablePromos = async (req, res) => {
  try {
    const now = new Date();

    const promos = await PromoCode.find({
      isActive: true,
      isReferral: { $ne: true }, // 🔥 Don't show referral templates in checkout
      $and: [
        {
          $or: [
            { validFrom: { $exists: false } },
            { validFrom: null },
            { validFrom: { $lte: now } }
          ]
        },
        {
          $or: [
            { validTill: { $exists: false } },
            { validTill: null },
            { validTill: { $gte: now } }
          ]
        }
      ]
    })
    .select(
      "code title discountType discountValue minAmount maxDiscount validTill"
    )
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: promos.length,
      promos
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};