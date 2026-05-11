const mongoose = require("mongoose");

const podcastSourceSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      trim: true,
      default: ""
    },

    category: {
      type: String,
      enum: [
        "youtube",
        "spotify",
        "audio",
        "video",
        "soundcloud",
        "google_podcast",
        "apple_podcast",
        "iframe",
        "webview",
        "other"
      ],
      default: "other"
    },

    url: {
      type: String,
      default: ""
    },

    priority: {
      type: Number,
      default: 1
    },

    isActive: {
      type: Boolean,
      default: true
    },

    notes: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const podcastSchema = new mongoose.Schema(
  {
    sportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sport",
      required: true
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

    url: {
      type: String,
      default: "",
      trim: true
    },

    type: {
      type: String,
      enum: ["youtube", "spotify", "audio", "video", "other"],
      default: "other"
    },

    sources: {
      type: [podcastSourceSchema],
      default: []
    },

    thumbnail: {
      type: String,
      default: ""
    },

    duration: {
      type: String,
      default: "" // e.g. "12:30"
    },

    category: {
      type: String,
      default: "",
      trim: true
    },

    isFeatured: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    isPremium: {
      type: Boolean,
      default: false
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    }
  },
  { timestamps: true }
);

// indexes
podcastSchema.index({ sportId: 1 });
podcastSchema.index({ status: 1 });
podcastSchema.index({ isFeatured: 1 });
podcastSchema.index({ isPremium: 1 });
podcastSchema.index({ type: 1 });

module.exports = mongoose.model("Podcast", podcastSchema);