const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },

    category: {
      type: String,
      enum: [
        "cricket",
        "football",
        "basketball",
        "tennis",
        "kabaddi",
        "news",
        "multi",
        "other"
      ],
      default: "other"
    },

    description: {
      type: String,
      default: ""
    },

    streamUrl: {
      type: String,
      required: true,
      trim: true
    },

    backupUrl: {
      type: String,
      default: "",
      trim: true
    },

    streamType: {
      type: String,
      enum: ["hls", "youtube", "iframe", "other"],
      default: "other"
    },

    quality: {
      type: String,
      enum: ["240p", "360p", "480p", "720p", "1080p", "auto"],
      default: "auto"
    },

    thumbnail: {
      type: String,
      default: ""
    },

    logo: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["live", "offline", "maintenance"],
      default: "offline"
    },

    viewerCount: {
      type: Number,
      default: 0
    },

    featured: {
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

channelSchema.index({ slug: 1 });
channelSchema.index({ status: 1 });
channelSchema.index({ category: 1 });

module.exports = mongoose.model("Channel", channelSchema);