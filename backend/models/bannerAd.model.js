const mongoose = require("mongoose");

const bannerAdSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      required: true
    },
    link: {
      type: String,
      default: ""
    },
    position: {
      type: String,
      default: "home_top",
      enum: [
        "home_top",
        "home_bottom",
        "match_details",
        "livetv_top",
        "event_top",
        "series_top",
        "highlights_top",
        "profile_top",
        "podcast",
        "star_players"
      ]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "BannerAd",
  bannerAdSchema
);