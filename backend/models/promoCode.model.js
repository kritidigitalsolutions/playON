const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
{
  code: {
    type: String,
    required: true,
    unique: true,
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

  validFrom: Date,
  validTill: Date,

  isActive: {
    type: Boolean,
    default: true
  },

  applicablePlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan"
  }]
},
{ timestamps: true }
);

module.exports = mongoose.model("PromoCode", promoCodeSchema);