const mongoose = require("mongoose");

const popupSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["PROMO", "IMAGE"],
      required: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    promo: {
      promoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PromoCode",
        default: null,
      },

      code: {
        type: String,
        trim: true,
        default: "",
      },

      discountType: {
        type: String,
        enum: ["flat", "percent"],
        default: "percent",
      },

      discountValue: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    image: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validation
popupSchema.pre("validate", function () {
  // Validate date range
  if (
    this.startDate &&
    this.endDate &&
    this.endDate < this.startDate
  ) {
    throw new Error("End date must be greater than or equal to start date.");
  }

  if (this.type === "PROMO") {
    if (
      !this.title ||
      !this.description ||
      !this.promo?.promoId
    ) {
      throw new Error(
        "Title, description and a valid promo are required for PROMO popup."
      );
    }

    // Promo popup should not have image
    this.set("image", "");
  }

  if (this.type === "IMAGE") {
    if (!this.image) {
      throw new Error("Image is required for IMAGE popup.");
    }

    // Image popup should not have promo content
    this.set("title", "");
    this.set("description", "");

    this.set("promo", {
      promoId: null,
      code: "",
      discountType: "percent",
      discountValue: 0,
    });
  }
});

// Indexes
popupSchema.index({ isActive: 1 });
popupSchema.index({ type: 1 });
popupSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("Popup", popupSchema);