const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
const upload = require("../../middlewares/upload.middleware");

const controller = require("../../controllers/bannerAd.controller");

// Create
router.post(
  "/",
  isAdmin,
  hasPermission("bannerAds", "create"),
  upload.single("image"),
  controller.createBanner
);

// List
router.get(
  "/",
  isAdmin,
  hasPermission("bannerAds", "view"),
  controller.getBanners
);

// Delete
router.delete(
  "/:id",
  isAdmin,
  hasPermission("bannerAds", "delete"),
  controller.deleteBanner
);

// Toggle Status
router.patch(
  "/:id/toggle",
  isAdmin,
  hasPermission("bannerAds", "edit"),
  controller.toggleBanner
);

// Update
router.put(
  "/:id",
  isAdmin,
  hasPermission("bannerAds", "edit"),
  upload.single("image"),
  controller.updateBanner
);

module.exports = router;