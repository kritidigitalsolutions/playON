const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    itemType: {
      type: String,
      enum: ["match", "channel", "stream"],
      required: true
    }
  },
  { timestamps: true }
);

watchlistSchema.index(
  { userId: 1, itemId: 1, itemType: 1 },
  { unique: true }
);

module.exports = mongoose.model("Watchlist", watchlistSchema);