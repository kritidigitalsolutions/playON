const mongoose = require("mongoose");

const commentSchema =
  new mongoose.Schema(
    {
      userId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true
      },

      // Match / Series / Podcast /
      // Highlight / StarPlayer
      itemId: {
        type:
          mongoose.Schema.Types.ObjectId,

        required: true,

        index: true
      },

      comment: {
        type: String,

        required: true,

        trim: true,

        maxlength: 1000
      },

      isDeleted: {
        type: Boolean,

        default: false
      },

      deletedAt: {
        type: Date,

        default: null
      }
    },

    {
      timestamps: true
    }
  );

// Compound index
commentSchema.index({
  itemId: 1,
  createdAt: -1
});

module.exports =
  mongoose.model(
    "Comment",
    commentSchema
  );