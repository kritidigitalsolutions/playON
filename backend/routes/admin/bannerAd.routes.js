const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const upload = require("../../middlewares/upload.middleware");

const controller = require("../../controllers/bannerAd.controller");

router.post(
  "/",
  isAdmin,
  upload.single("image"),
  controller.createBanner
);

router.get("/", isAdmin, controller.getBanners);

router.delete(
  "/:id",
  isAdmin,
  controller.deleteBanner
);

router.patch(
  "/:id/toggle",
  isAdmin,
  controller.toggleBanner
);

router.put(
  "/:id",
  isAdmin,
  upload.single("image"),
  controller.updateBanner
);

module.exports = router;