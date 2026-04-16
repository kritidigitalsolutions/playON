const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
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

    sport: {
      type: String,
      required: true,
      trim: true
    },

    team: {
      type: String,
      default: "",
      trim: true
    },

    position: {
      type: String,
      default: "",
      trim: true
    },

    country: {
      type: String,
      default: "",
      trim: true
    },

    image: {
      type: String,
      default: ""
    },

    bio: {
      type: String,
      default: ""
    },

    featured: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

playerSchema.index({ sport: 1 });
playerSchema.index({ team: 1 });

module.exports = mongoose.model("Player", playerSchema);