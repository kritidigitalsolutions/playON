const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: [
        "GENERAL",
        "MATCH",
        "STREAM",
        "SERIES",
        "CHANNEL",
        "PLAN",
        "SUBSCRIPTION",
        "SYSTEM",
        "PROMOTIONAL"
      ],
      default: "GENERAL"
    },

    // null = broadcast to all users
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    isRead: {
      type: Boolean,
      default: false
    },

    readAt: {
      type: Date,
      default: null
    },

    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        readAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    deletedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        deletedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
metadata: {
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Match"
  },

  streamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stream"
  },

  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel"
  },

  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan"
  },

  actionUrl: String,

  image: {
    type: String,
    default: ""
  }
},
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    },

    isActive: {
      type: Boolean,
      default: true
    },

    sentAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

notificationSchema.index({ targetUser: 1, createdAt: -1 });
notificationSchema.index({ isActive: 1 });

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);