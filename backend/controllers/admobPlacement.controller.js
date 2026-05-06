const admobPlacementService = require("../services/admobPlacement.service");
const User = require("../models/user.model");

const buildPayload = (body = {}) => ({
  title: body.title,
  position: body.position,
  adUnitId: body.adUnitId,
  format: body.format,
  sortOrder: body.sortOrder || 0,
  isActive: body.isActive,
  notes: body.notes || ""
});

exports.createPlacement = async (req, res) => {
  try {
    const placement = await admobPlacementService.createPlacement(buildPayload(req.body));

    res.status(201).json({
      success: true,
      placement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPlacements = async (req, res) => {
  try {
    const placements = await admobPlacementService.getPlacements();

    res.status(200).json({
      success: true,
      placements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updatePlacement = async (req, res) => {
  try {
    const placement = await admobPlacementService.updatePlacement(
      req.params.id,
      buildPayload(req.body)
    );

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: "AdMob placement not found"
      });
    }

    res.status(200).json({
      success: true,
      placement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.togglePlacement = async (req, res) => {
  try {
    const placement = await admobPlacementService.togglePlacement(req.params.id);

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: "AdMob placement not found"
      });
    }

    res.status(200).json({
      success: true,
      placement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deletePlacement = async (req, res) => {
  try {
    await admobPlacementService.deletePlacement(req.params.id);

    res.status(200).json({
      success: true,
      message: "AdMob placement deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPublicPlacements = async (req, res) => {
  try {
    if (req.user?.userId) {
      const user = await User.findById(req.user.userId);

      if (
        user &&
        user.adsDisabled &&
        (
          user.adFreePurchaseType === "lifetime" ||
          (user.adsExpiry && user.adsExpiry > new Date())
        )
      ) {
        return res.status(200).json({
          success: true,
          placements: []
        });
      }
    }

    const placements = await admobPlacementService.getPublicPlacements(req.query.position);

    res.status(200).json({
      success: true,
      placements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
