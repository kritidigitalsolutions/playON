const mongoose = require("mongoose");

const highlightSchema =
  new mongoose.Schema(
    {
      // Match highlight
      matchId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Match",

        default: null,

        index: true
      },

      // Tournament / Series highlight
      seriesId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Series",

        default: null,

        index: true
      },

      title: {
        type: String,

        required: true,

        trim: true,

        maxlength: 200
      },

      description: {
        type: String,

        default: "",

        trim: true,

        maxlength: 2000
      },

      category: {
        type: String,

        enum: [
          "full_match",
          "batting",
          "bowling",
          "fielding",
          "goal",
          "save",
          "other"
        ],

        default: "other",

        lowercase: true
      },

      // "url" = external video URL
      // "upload" = uploaded to Firebase
      sourceType: {
        type: String,

        enum: ["url", "upload"],

        default: "url"
      },

      videoUrl: {
        type: String,

        required: true,

        trim: true
      },

      thumbnail: {
        type: String,

        default: "",

        trim: true
      },

      // Duration in seconds
      duration: {
        type: Number,

        default: 0,

        min: 0
      },

      tags: {
        type: [String],

        default: []
      },

      isPremium: {
        type: Boolean,

        default: false
      },

      isFeatured: {
        type: Boolean,

        default: false
      },

      views: {
        type: Number,

        default: 0,

        min: 0
      },

      order: {
        type: Number,

        default: 0
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Admin",

        default: null
      },

      // Soft delete
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

// Must belong to either match or series
highlightSchema.pre(
  "validate",
  function () {
    if (
      !this.matchId &&
      !this.seriesId
    ) {
      throw new Error(
        "Either matchId or seriesId is required"
      );
    }
  }
);

// Cleanup tags
highlightSchema.pre(
  "save",
  function () {
    if (this.tags?.length) {
      this.tags = this.tags.map(
        (tag) =>
          tag
            .trim()
            .toLowerCase()
      );
    }
  }
);

// Indexes
highlightSchema.index({
  matchId: 1,
  order: 1
});

highlightSchema.index({
  seriesId: 1,
  order: 1
});

highlightSchema.index({
  category: 1
});

highlightSchema.index({
  isPremium: 1
});

highlightSchema.index({
  isFeatured: 1
});

highlightSchema.index({
  createdAt: -1
});

module.exports =
  mongoose.model(
    "Highlight",
    highlightSchema
  );