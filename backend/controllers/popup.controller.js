const Popup = require("../models/popup.model");

// Get Active Popup
exports.getActivePopup = async (req, res) => {
  try {
    const currentDate = new Date();

    const popup = await Popup.findOne({
      isActive: true,
      $or: [
        // No schedule
        {
          startDate: null,
          endDate: null,
        },
        // Within scheduled duration
        {
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate },
        },
      ],
    })
      .populate("promo.promoId")
      .sort({ createdAt: -1 });

    if (!popup) {
      return res.status(200).json({
        success: true,
        message: "No active popup found.",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: popup,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};