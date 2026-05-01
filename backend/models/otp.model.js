const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      trim: true
      // ❌ removed index: true (duplicate)
    },

    otp: {
      type: String,
      required: true
    },

    expiresAt: {
      type: Date,
      required: true
      // TTL index defined below
    }
  },
  { timestamps: true }
);

// ✅ Only ONE index for mobile (unique)
otpSchema.index({ mobile: 1 }, { unique: true });

// ✅ TTL index (auto delete after expiresAt)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);