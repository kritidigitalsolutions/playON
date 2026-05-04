const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  mobile: {
    type: String,
    default: null,
    trim: true
  },

  fullName: {
    type: String,
    default: "",
    trim: true
  },

  googleId: {
    type: String,
    default: null
  },

  facebookId: {
    type: String,
    default: null
  },

  authProvider: {
    type: String,
    enum: ["mobile", "google", "facebook"],
    default: "mobile"
  },

  email: {
    type: String,
    default: null,
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

  followedPlayers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player"
    }
  ],

  followedSeries: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series"
    }
  ],

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
  },

  // =====================
  // REFERRAL SYSTEM
  // =====================

  referralCode: {
    type: String,
    trim: true,
    uppercase: true,
    default: null
  },

  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  referralCount: {
    type: Number,
    default: 0
  },

  hasCompletedReferralReward: {
    type: Boolean,
    default: false
  }

},
{ timestamps: true }
);

// =====================
// INDEXES
// =====================

// Unique mobile (only active users)
userSchema.index(
  { mobile: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      mobile: { $exists: true, $ne: null }
    }
  }
);

// Unique email
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $exists: true, $ne: null }
    }
  }
);

// Unique Google ID
userSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      googleId: { $exists: true, $ne: null }
    }
  }
);

// Unique Facebook ID
userSchema.index(
  { facebookId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      facebookId: { $exists: true, $ne: null }
    }
  }
);

// Unique referral code
userSchema.index(
  { referralCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      referralCode: { $exists: true, $ne: null }
    }
  }
);

module.exports = mongoose.model("User", userSchema);