const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true
    },

    // WHAT USER BOUGHT
    accessType: {
  type: String,
  enum: [
    "match_pass",
    "team_pass",
    "series_pass",
    "monthly_pass",
    "yearly_pass",
    "ad_free"
  ],
  required: true
},

    // OPTIONAL RELATIONS
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    },

    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null
    },

    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series",
      default: null
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active"
    },

    startDate: {
      type: Date,
      default: Date.now
    },

    endDate: {
      type: Date,
      required: true
    },

    amountPaid: {
      type: Number,
      required: true
    },

    paymentId: {
      type: String,
      default: ""
    },

    autoRenew: {
      type: Boolean,
      default: false
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Subscription",
  subscriptionSchema
);