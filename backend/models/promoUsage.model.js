const mongoose = require("mongoose");

const promoUsageSchema = new mongoose.Schema(
{
  promoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PromoCode",
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  orderId: {
    type: String,
    default: ""
  },

  paymentId: {
    type: String,
    default: ""
  }
},
{ timestamps: true }
);

promoUsageSchema.index(
  { promoId: 1, userId: 1 },
  { unique: true }
);

module.exports = mongoose.model("PromoUsage", promoUsageSchema);