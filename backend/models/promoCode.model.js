const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
{
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },

  title: {
    type: String,
    default: ""
  },

  discountType: {
    type: String,
    enum: ["flat", "percent"],
    required: true
  },

  discountValue: {
    type: Number,
    required: true
  },

  minAmount: {
    type: Number,
    default: 0
  },

  maxDiscount: {
    type: Number,
    default: 0
  },

  usageLimit: {
    type: Number,
    default: 0
  },

  usedCount: {
    type: Number,
    default: 0
  },

  perUserLimit: {
    type: Number,
    default: 1
  },

  validFrom: {
    type: Date,
    default: null
  },

  validTill: {
    type: Date,
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // 🔥 Referral flag (global offer)
  isReferral: {
    type: Boolean,
    default: false
  },

  // Empty array = applicable to all plans
  applicablePlans: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan"
    }
  ],

  // null = global promo, ObjectId = user-specific reward
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }

},
{ timestamps: true }
);

// =======================
// INDEXES (IMPORTANT)
// =======================

// Unique code (safe)
promoCodeSchema.index(
  { code: 1 },
  {
    unique: true,
    partialFilterExpression: {
      code: { $exists: true, $ne: null }
    }
  }
);

// For referral queries (performance)
promoCodeSchema.index({
  isReferral: 1,
  assignedTo: 1,
  isActive: 1
});

// For expiry + active filtering
promoCodeSchema.index({
  isActive: 1,
  validFrom: 1,
  validTill: 1
});

module.exports = mongoose.model("PromoCode", promoCodeSchema);