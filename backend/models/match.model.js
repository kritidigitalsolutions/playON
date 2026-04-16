const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: ""
    },

    sport: {
      type: String,
      required: true,
      enum: [
        "cricket",
        "football",
        "basketball",
        "kabaddi",
        "tennis",
        "volleyball",
        "other"
      ],
      lowercase: true,
      trim: true
    },

    teamA: {
      type: String,
      required: true,
      trim: true
    },

    teamB: {
      type: String,
      required: true,
      trim: true
    },

    teamALogo: {
      type: String,
      default: ""
    },

    teamBLogo: {
      type: String,
      default: ""
    },

    tournament: {
      type: String,
      default: "",
      trim: true
    },

    venue: {
      type: String,
      default: "",
      trim: true
    },

    matchDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["upcoming", "live", "completed", "cancelled"],
      default: "upcoming",
      lowercase: true
    },

    thumbnail: {
      type: String,
      default: ""
    },

    banner: {
      type: String,
      default: ""
    },

    streamUrl: {
      type: String,
      default: ""
    },

    streamType: {
      type: String,
      enum: ["hls", "youtube", "iframe", "other"],
      default: "other"
    },

    score: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    isFeatured: {
      type: Boolean,
      default: false
    },

    liveStartedAt: {
      type: Date,
      default: null
    },

    liveEndedAt: {
      type: Date,
      default: null
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

// Useful indexes
matchSchema.index({ sport: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ matchDate: 1 });
matchSchema.index({ isFeatured: 1 });

module.exports = mongoose.model("Match", matchSchema);