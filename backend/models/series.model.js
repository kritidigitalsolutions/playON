const mongoose = require("mongoose");

const seriesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
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

    slug: {
      type: String,
      default: "",
      lowercase: true,
      trim: true
    },

    banner: {
      type: String,
      default: ""
    },

    tournamentLogo: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    teamA: {
      type: String,
      default: "",
      trim: true
    },

    teamB: {
      type: String,
      default: "",
      trim: true
    },

    teamAPlayers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player"
      }
    ],

    teamBPlayers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player"
      }
    ],

    tourCountry: {
      type: String,
      default: "",
      trim: true
    },

    startDate: {
      type: Date,
      default: null
    },

    endDate: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      enum: ["upcoming", "live", "completed", "archived"],
      default: "upcoming"
    },

    isFeatured: {
      type: Boolean,
      default: false
    },
    isTrending: {
      type: Boolean,
      default: false
    },
    isHomeScreen: {
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

seriesSchema.index({ sport: 1 });
seriesSchema.index({ status: 1 });
seriesSchema.index({ isFeatured: 1 });
seriesSchema.index({ isTrending: 1 });
seriesSchema.index({ isPremium: 1 });
seriesSchema.index({ slug: 1 });
seriesSchema.index(
  { title: 1, sport: 1 },
  { unique: true }
);

module.exports = mongoose.model("Series", seriesSchema);
