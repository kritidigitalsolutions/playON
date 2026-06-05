const mongoose = require("mongoose");

const highlightSourceSchema = new mongoose.Schema({
  provider: { type: String, default: "" },
  category: { 
    type: String, 
    enum: ["youtube", "mp4", "m3u8", "iframe", "audio", "other"], 
    default: "other" 
  },
  url: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

const starPlayerHighlightSchema = new mongoose.Schema(
  {
    sportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sport",
      required: true
    },

    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: false
    },

    playerName: {
      type: String,
      required: true,
      trim: true
    },

    team: {
      type: String,
      default: ""
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    thumbnail: {
      type: String,
      default: ""
    },

    videoUrl: {
      type: String,
      default: ""
    },

    type: {
      type: String,
      default: "other"
    },

    sources: [highlightSourceSchema],

    duration: {
      type: String,
      default: ""
    },

    isFeatured: {
      type: Boolean,
      default: false
    },

    isPremium: {
      type: Boolean,
      default: false
    },

    liveLogo: {
      type: String,
      default: ""
    },

    showLiveLogo: {
      type: Boolean,
      default: false
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  { timestamps: true }
);

// Optional indexes
starPlayerHighlightSchema.index({ sportId: 1 });
starPlayerHighlightSchema.index({ playerId: 1 });
starPlayerHighlightSchema.index({ isFeatured: 1 });
starPlayerHighlightSchema.index({ isPremium: 1 });

module.exports = mongoose.model(
  "StarPlayerHighlight",
  starPlayerHighlightSchema
);