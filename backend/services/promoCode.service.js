const PromoCode = require("../models/promoCode.model");
const PromoUsage = require("../models/promoUsage.model");

exports.validatePromo = async ({
  code,
  userId,
  planId,
  amount
}) => {
  if (!code) {
    throw new Error("Promo code is required");
  }

  const promo = await PromoCode.findOne({
    code: code.toUpperCase().trim(),
    isActive: true
  });

  if (!promo) {
    throw new Error("Invalid promo code");
  }

  // 🔒 USER-SPECIFIC PROMO CHECK (Referral support)
if (promo.assignedTo) {
  if (promo.assignedTo.toString() !== userId.toString()) {
    throw new Error("This promo is not assigned to you");
  }
}
  const now = new Date();

  // Start date check
  if (promo.validFrom && now < promo.validFrom) {
    throw new Error("Promo not started yet");
  }

  // Expiry check
  if (promo.validTill && now > promo.validTill) {
    throw new Error("Promo expired");
  }

  // Global usage check
  if (
    promo.usageLimit > 0 &&
    promo.usedCount >= promo.usageLimit
  ) {
    throw new Error("Promo limit reached");
  }

  // Minimum amount check
  if (amount < promo.minAmount) {
    throw new Error(
      `Minimum amount is ${promo.minAmount}`
    );
  }

  // Applicable plans check
  if (
    promo.applicablePlans.length > 0 &&
    !promo.applicablePlans.some(
      id => id.toString() === planId.toString()
    )
  ) {
    throw new Error("Promo not valid for this plan");
  }

  // Per user check
  const userUsedCount =
    await PromoUsage.countDocuments({
      promoId: promo._id,
      userId
    });

  if (userUsedCount >= promo.perUserLimit) {
    throw new Error(
      "You already used this promo"
    );
  }

  let discount = 0;

  if (promo.discountType === "flat") {
    discount = promo.discountValue;
  }

  if (promo.discountType === "percent") {
    discount =
      (amount * promo.discountValue) / 100;

    if (promo.maxDiscount > 0) {
      discount = Math.min(
        discount,
        promo.maxDiscount
      );
    }
  }

  const finalAmount = Math.max(
    amount - discount,
    1
  );

  return {
    promo,
    discount,
    finalAmount
  };
};