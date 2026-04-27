const bannerService = require("../services/bannerAd.service");
const uploadToFirebase = require("../utils/uploadToFirebase");
const User = require("../models/user.model");

// Create Banner
exports.createBanner = async (req, res) => {
  try {
    let image = "";

    if (req.file) {
      image = await uploadToFirebase(
        req.file,
        "banner-ads"
      );
    }

    const data = await bannerService.createBanner({
      title: req.body.title,
      image,
      link: req.body.link,
      position: req.body.position,
      sortOrder: req.body.sortOrder || 0
    });

    res.status(201).json({
      success: true,
      banner: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin List
exports.getBanners = async (req, res) => {
  try {
    const data = await bannerService.getBanners();

    res.status(200).json({
      success: true,
      banners: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete
exports.deleteBanner = async (req, res) => {
  try {
    await bannerService.deleteBanner(req.params.id);

    res.status(200).json({
      success: true,
      message: "Banner deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle
exports.toggleBanner = async (req, res) => {
  try {
    const data = await bannerService.toggleBanner(
      req.params.id
    );

    res.status(200).json({
      success: true,
      banner: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update
exports.updateBanner = async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      link: req.body.link,
      position: req.body.position,
      sortOrder: req.body.sortOrder,
      isActive: req.body.isActive
    };

    if (req.file) {
      updateData.image = await uploadToFirebase(req.file, "banner-ads");
    }

    const data = await bannerService.updateBanner(req.params.id, updateData);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    res.status(200).json({
      success: true,
      banner: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Public
exports.getPublicBanners = async (req, res) => {
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
          banners: []
        });
      }
    }

    const data = await bannerService.getPublicBanners(
      req.query.position
    );

    res.status(200).json({
      success: true,
      banners: data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Click
exports.incrementClick = async (req, res) => {
  try {
    await bannerService.incrementClick(req.params.id);

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};