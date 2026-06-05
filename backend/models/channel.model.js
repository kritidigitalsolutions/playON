const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    channelNumber: {
      type: Number,
      unique: true,
      required: true
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },

    category: {
      type: String,
      default: "other",
      lowercase: true,
      trim: true
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
    rtmpUrl: {
      type: String,
      default: "",
      trim: true
    },

    srtUrl: {
      type: String,
      default: "",
      trim: true
    },

    // streamType: {
    //   type: String,
    //   enum: ["hls", "youtube", "iframe", "other"],
    //   default: "other"
    // },
    streamType: {
      type: String,
      enum: ["hls", "youtube", "iframe", "rtmp", "srt", "other"],
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

liveLogo: {
  type: String,
  default: ""
},

    showLiveLogo: {
      type: Boolean,
      default: false
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

// channelSchema.index({ slug: 1 }); // Removed as it's already indexed via unique: true
channelSchema.index({ status: 1 });
channelSchema.index({ category: 1 });
channelSchema.index({ isPremium: 1 });

module.exports = mongoose.model("Channel", channelSchema);