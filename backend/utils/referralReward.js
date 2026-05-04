const PromoCode = require("../models/promoCode.model");
const autoNotify = require("./autoNotify");

// 🔑 Generate unique promo code
const generatePromoCode = () => {
  return "REF_" + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const getUniquePromoCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = generatePromoCode();
    const existing = await PromoCode.findOne({ code });
    if (!existing) exists = false;
  }

  return code;
};

exports.rewardReferrer = async (userId) => {
  try {
    // prevent spam rewards (optional logic)
    const existing = await PromoCode.findOne({
      assignedTo: userId,
      title: "Referral Reward",
      createdAt: {
        $gt: new Date(Date.now() - 5 * 60 * 1000)
      }
    });

    if (existing) return;

    // 🏷️ Fetch referral offer template
    const template = await PromoCode.findOne({
      isActive: true,
      isReferral: true,
      assignedTo: null
    }).sort({ createdAt: -1 });

    const code = await getUniquePromoCode();
    const now = new Date();

    await PromoCode.create({
      code,
      title: template?.title || "Referral Reward",

      discountType: template?.discountType || "percent",
      discountValue: template?.discountValue || 20,

      minAmount: template?.minAmount || 0,
      maxDiscount: template?.maxDiscount || 100,

      usageLimit: 1,
      perUserLimit: 1,

      validFrom: now,
      validTill: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),

      isActive: true,
      assignedTo: userId
    });

    // 🔔 USE YOUR EXISTING NOTIFICATION SYSTEM
    await autoNotify({
      title: "Referral Reward 🎉",
      message: `You earned a promo code: ${code}`,
      type: "REFERRAL_REWARD",
      targetUser: userId,
      metadata: {
        promoCode: code
      }
    });

    console.log("Referral reward complete:", code);

  } catch (error) {
    console.error("Referral reward error:", error.message);
  }
};