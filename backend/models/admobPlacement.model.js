const mongoose = require("mongoose");

const PLACEMENT_POSITIONS = [
  "home_top",
  "home_bottom",
  "match_details",
  "livetv_top"
];

const AD_FORMATS = [
  "banner",
  "adaptive_banner",
  "interstitial",
  "rewarded",
  "native"
];

const admobPlacementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      enum: PLACEMENT_POSITIONS,
      default: "home_top",
      index: true
    },
    adUnitId: {
      type: String,
      required: true,
      trim: true
    },
    format: {
      type: String,
      enum: AD_FORMATS,
      default: "banner"
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    notes: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AdmobPlacement", admobPlacementSchema);
