const mongoose = require("mongoose");

const socialMediaSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: [
        "facebook",
        "instagram",
        "twitter", // X
        "youtube",
        "linkedin",
        "email"
      ],
      unique: true
    },

    url: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocialMedia", socialMediaSchema);