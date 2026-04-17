const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true
    },

    billingType: {
      type: String,
      enum: ["monthly", "yearly", "per_match"],
      required: true
    },

    durationDays: {
      type: Number,
      required: true,
      min: 1
    },

    features: {
      type: [String],
      default: []
    },

    buttonText: {
      type: String,
      default: "Buy Now"
    },

    description: {
      type: String,
      default: ""
    },

    badge: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    },

    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

planSchema.pre("save", function () {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }
});


module.exports = mongoose.model("Plan", planSchema);