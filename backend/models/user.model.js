const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    fullName: {
      type: String,
      default: "",
      trim: true
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },

    isProfileComplete: {
      type: Boolean,
      default: false
    },

    favoriteSports: {
      type: [String],
      default: []
    },

    profilePic: {
      type: String,
      default: ""
    },
    followedPlayers: {
  type: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player"
    }
  ],
  default: []
}
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);