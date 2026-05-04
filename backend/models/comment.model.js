const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
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

    comment: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

commentSchema.index({ itemId: 1 });

module.exports = mongoose.model("Comment", commentSchema);