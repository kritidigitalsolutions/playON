const mongoose = require("mongoose");

const scoreSourceSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      trim: true,
      default: ""
    },

    category: {
      type: String,
      enum: [
        "official_api",
        "third_party_api",
        "rapidapi",
        "manual",
        "web_scrape",
        "rss_feed",
        "json_feed",
        "xml_feed",
        "iframe",
        "webview",
        "socket",
        "websocket",
        "firebase",
        "supabase",
        "google_sheet",
        "cms",
        "admin_panel",
        "cron_job",
        "static_url",
        "backup",
        "ai_parser",
        "custom_provider",
        "other"
      ],
      default: "third_party_api"
    },

    url: {
      type: String,
      default: ""
    },

    apiKey: {
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

    // score: {
    //   type: String,
    //   default: ""
    // },

    scoreSources: {
      type: [scoreSourceSchema],
      default: []
    },

    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series",
      default: null
    },

    description: {
      type: String,
      default: ""
    },

    isFeatured: {
      type: Boolean,
      default: false
    },
    isTrending: {
      type: Boolean,
      default: false
    },

    isPremium: {
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

    highlightlyMatchId: {
      type: String,
      default: null,
      index: true
    },

    highlightlySport: {
      type: String,
      default: null
    },

    // ← ADD THESE NEW FIELDS:
    highlightlyStatus: {
      type: String,
      default: null,
      description: "Original status from Highlightly API"
    },

    highlightlyLastSync: {
      type: Date,
      default: null,
      description: "Last time we synced with Highlightly"
    },

    highlightlyData: {
      type: Object,
      default: null,
      description: "Full response from Highlightly for debugging"
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
matchSchema.index({ isPremium: 1 });
matchSchema.index({ seriesId: 1 });

module.exports = mongoose.model("Match", matchSchema);
