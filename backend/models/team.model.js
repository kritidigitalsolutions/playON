const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      default: "",
      lowercase: true,
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
      lowercase: true
    },

    logo: {
      type: String,
      default: ""
    },

    shortName: {
      type: String,
      default: ""
    },

    country: {
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

teamSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }
 
});

module.exports = mongoose.model("Team", teamSchema);