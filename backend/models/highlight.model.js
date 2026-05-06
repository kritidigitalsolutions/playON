const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    category: {
      type: String,
      enum: ["full_match", "batting", "bowling", "fielding", "goal", "save", "other"],
      default: "other"
    },

    // "url"  → admin pasted an external link (YouTube, direct MP4, HLS, etc.)
    // "upload" → admin uploaded a video file (stored in Firebase)
    sourceType: {
      type: String,
      enum: ["url", "upload"],
      default: "url"
    },

    videoUrl: {
      type: String,
      required: true,
      trim: true
    },

    thumbnail: {
      type: String,
      default: ""
    },

    duration: {
      type: String,
      default: ""
    },

    tags: {
      type: [String],
      default: []
    },

    isPremium: {
      type: Boolean,
      default: false
    },

    order: {
      type: Number,
      default: 0
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    }
  },
  { timestamps: true }
);

highlightSchema.index({ matchId: 1, order: 1 });
highlightSchema.index({ isPremium: 1 });

module.exports = mongoose.model("Highlight", highlightSchema);
