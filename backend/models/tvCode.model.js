const mongoose = require("mongoose");

const tvCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      length: 4
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    used: {
      type: Boolean,
      default: false
    },

    deviceName: {
      type: String,
      default: ""
    },

    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

// optional indexes
tvCodeSchema.index({ code: 1 });
tvCodeSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("TvCode", tvCodeSchema);