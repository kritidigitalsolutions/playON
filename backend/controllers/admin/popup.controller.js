const popupService = require("../../services/popup.service");
const Popup = require("../../models/popup.model");
const PromoCode = require("../../models/promoCode.model");

const uploadToFirebase = require("../../utils/uploadToFirebase");
const deleteFromFirebase = require("../../utils/deleteFromFirebase");

// ==========================
// Helpers
// ==========================
const hasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key);

const formatPopup = (doc) => {
  if (!doc) return null;
  return doc.toObject ? doc.toObject() : doc;
};

// ==========================
// Create Popup
// ==========================
exports.createPopup = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      promoId,
      startDate,
      endDate,
    } = req.body;

    if (!["PROMO", "IMAGE"].includes(type)) {
  return res.status(400).json({
    success: false,
    message: "Invalid popup type.",
  });
}

    let image = "";

    let promo = {
      promoId: null,
      code: "",
      discountType: "percent",
      discountValue: 0,
    };

    // ==========================
    // IMAGE POPUP
    // ==========================
    if (type === "IMAGE") {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Image is required.",
        });
      }

      image = await uploadToFirebase(req.file, "popups");
    }

    // ==========================
    // PROMO POPUP
    // ==========================
    if (type === "PROMO") {
      const promoDoc = await PromoCode.findById(promoId);

      if (!promoDoc) {
        return res.status(404).json({
          success: false,
          message: "Promo code not found.",
        });
      }

      if (!promoDoc.isActive) {
        return res.status(400).json({
          success: false,
          message: "Selected promo code is inactive.",
        });
      }

      promo = {
        promoId: promoDoc._id,
        code: promoDoc.code,
        discountType: promoDoc.discountType,
        discountValue: promoDoc.discountValue,
      };
    }

    const isActive = req.body.isActive !== undefined ? (req.body.isActive === "true" || req.body.isActive === true) : true;

    // deactivate previous popup if this popup is active
    if (isActive) {
      await Popup.updateMany(
        { isActive: true },
        {
          $set: {
            isActive: false,
          },
        }
      );
    }

    const popup = await popupService.createPopup({
      type,
      title,
      description,
      promo,
      image,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive,
    });

    return res.status(201).json({
      success: true,
      message: "Popup created successfully.",
      popup: formatPopup(popup),
    });
  } catch (error) {
    

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================
// Get All Popups
// ==========================
exports.getAllPopups = async (req, res) => {
  try {
    const result = await popupService.getAllPopups(req.query);

    return res.status(200).json({
      success: true,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      popups: result.popups.map((popup) =>
        formatPopup(popup)
      ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Get Single Popup
// ==========================
exports.getSinglePopup = async (req, res) => {
  try {
    const popup = await popupService.getPopupById(
      req.params.id
    );

    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found.",
      });
    }

    return res.status(200).json({
      success: true,
      popup: formatPopup(popup),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================
// Update Popup
// ==========================
exports.updatePopup = async (req, res) => {
  try {
    const popup = await popupService.getPopupById(req.params.id);

    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found.",
      });
    }

    const type = req.body.type || popup.type;

    const isActive = req.body.isActive !== undefined ? (req.body.isActive === "true" || req.body.isActive === true) : popup.isActive;

    const data = {
      type,
      title: hasOwn(req.body, "title")
        ? req.body.title
        : popup.title,
      description: hasOwn(req.body, "description")
        ? req.body.description
        : popup.description,
      startDate: hasOwn(req.body, "startDate")
        ? req.body.startDate || null
        : popup.startDate,
      endDate: hasOwn(req.body, "endDate")
        ? req.body.endDate || null
        : popup.endDate,
      isActive,
    };

    // Only one popup active
    if (isActive) {
      await Popup.updateMany(
        { _id: { $ne: popup._id } },
        { $set: { isActive: false } }
      );
    }

    // ==========================
    // IMAGE POPUP
    // ==========================
    if (type === "IMAGE") {
      if (req.file) {
        if (popup.image) {
          await deleteFromFirebase(popup.image);
        }

        data.image = await uploadToFirebase(
          req.file,
          "popups"
        );
     } else {
  if (!popup.image) {
    return res.status(400).json({
      success: false,
      message: "Image is required.",
    });
  }

  data.image = popup.image;
}

      data.promo = {
        promoId: null,
        code: "",
        discountType: "percent",
        discountValue: 0,
      };
    }

    // ==========================
    // PROMO POPUP
    // ==========================
    if (type === "PROMO") {
      if (popup.image) {
        await deleteFromFirebase(popup.image);
      }

      data.image = "";

      if (req.body.promoId) {
        const promoDoc = await PromoCode.findById(
          req.body.promoId
        );

        if (!promoDoc) {
          return res.status(404).json({
            success: false,
            message: "Promo code not found.",
          });
        }

        if (!promoDoc.isActive) {
          return res.status(400).json({
            success: false,
            message: "Selected promo code is inactive.",
          });
        }

        data.promo = {
          promoId: promoDoc._id,
          code: promoDoc.code,
          discountType: promoDoc.discountType,
          discountValue: promoDoc.discountValue,
        };
      } else {
        data.promo = popup.promo;
      }
    }

    const updatedPopup =
      await popupService.updatePopup(
        req.params.id,
        data
      );

    return res.status(200).json({
      success: true,
      message: "Popup updated successfully.",
      popup: formatPopup(updatedPopup),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Delete Popup
// ==========================
exports.deletePopup = async (req, res) => {
  try {
    const popup =
      await popupService.deletePopup(
        req.params.id
      );

    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found.",
      });
    }

    if (popup.image) {
      await deleteFromFirebase(
        popup.image
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Popup deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================
// Get Active Promo Codes
// ==========================
exports.getPopupPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find({
      isActive: true,
    })
      .select("_id code discountType discountValue")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      promos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};