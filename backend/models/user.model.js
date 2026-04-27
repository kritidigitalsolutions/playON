const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  mobile: {
    type: String,
    required: true,
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
    unique: true,
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

  fcmToken: {
    type: String,
    default: ""
  },

  profilePic: {
    type: String,
    default: ""
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: {
    type: Date,
    default: null
  },

  deleteReason: {
    type: String,
    default: ""
  },

  accountStatus: {
    type: String,
    enum: ["active", "deleted"],
    default: "active"
  },

  followedPlayers: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player"
      }
    ],
    default: []
  },

  followedSeries: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Series"
      }
    ],
    default: []
  },

  // AD FREE ACCESS
  adsDisabled: {
    type: Boolean,
    default: false
  },

  adsExpiry: {
    type: Date,
    default: null
  },

  adFreePurchaseType: {
    type: String,
    enum: ["none", "temporary", "lifetime"],
    default: "none"
  }

},
{ timestamps: true }
);

userSchema.index(
  { mobile: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false
    }
  }
);

module.exports = mongoose.model("User", userSchema);