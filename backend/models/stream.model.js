const mongoose = require("mongoose");

const streamSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true
    },

    title: {
      type: String,
      default: "",
      trim: true
    },

    provider: {
      type: String,
      default: "",
      trim: true
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
      enum: ["hls", "youtube", "iframe", "rtmp", "srt", "other"],
      default: "other"
    },

    quality: {
      type: String,
      enum: ["240p", "360p", "480p", "720p", "1080p", "auto"],
      default: "auto"
    },

    status: {
      type: String,
      enum: ["scheduled", "live", "offline", "ended", "failed"],
      default: "scheduled"
    },

    thumbnail: {
      type: String,
      default: ""
    },

    viewerCount: {
      type: Number,
      default: 0
    },

    health: {
      type: String,
      enum: ["good", "warning", "critical", "unknown"],
      default: "unknown"
    },

    scheduledAt: {
      type: Date,
      default: null
    },

    startedAt: {
      type: Date,
      default: null
    },

    endedAt: {
      type: Date,
      default: null
    },

    notes: {
      type: String,
      default: ""
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    }
  },
  {
    timestamps: true
  }
);

streamSchema.index({ matchId: 1 });
streamSchema.index({ status: 1 });
streamSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model("Stream", streamSchema);