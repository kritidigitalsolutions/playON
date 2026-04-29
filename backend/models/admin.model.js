const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  },
  { _id: false }
);

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["super_admin", "sub_admin"],
      default: "sub_admin"
    },

    permissions: {
      matches: {
        type: permissionSchema,
        default: () => ({})
      },

      streams: {
        type: permissionSchema,
        default: () => ({})
      },

      channels: {
        type: permissionSchema,
        default: () => ({})
      },

      users: {
        type: permissionSchema,
        default: () => ({})
      },

      notifications: {
        type: permissionSchema,
        default: () => ({})
      },

      plans: {
        type: permissionSchema,
        default: () => ({})
      },

      promos: {
        type: permissionSchema,
        default: () => ({})
      },

      bannerAds: {
        type: permissionSchema,
        default: () => ({})
      },

      admins: {
        type: permissionSchema,
        default: () => ({})
      }
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);