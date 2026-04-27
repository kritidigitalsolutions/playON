const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true
    },

    // MAIN PLAN TYPE
   planType: {
  type: String,
  enum: [
    "match_pass",
    "team_pass",
    "series_pass",
    "monthly_pass",
    "yearly_pass",
    "ad_free"
  ],
  required: true
},

    // RELATIONS
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    },

    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series",
      default: null
    },

    durationDays: {
      type: Number,
      required: true,
      min: 1
    },

    features: {
      type: [String],
      default: []
    },

   buttonText: {
  type: String,
  enum: [
    "Choose The Match",
    "Choose The Team",
    "Choose The Series",
    "Unlock Now",
    "Go Ad-Free"
  ],
  default: "Unlock Now"
},
    description: {
      type: String,
      default: ""
    },

    badge: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    },

    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

planSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }

  
});

module.exports = mongoose.model("Plan", planSchema);
