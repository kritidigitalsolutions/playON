const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");

const {
  createSocialMedia,
  getAllSocialMedia,
  updateSocialMedia,
  deleteSocialMedia
} = require("../../controllers/admin/socialMedia.controller");

// CREATE
router.post(
  "/social-media",
  isAdmin,
  hasPermission("socialMedia", "create"),
  createSocialMedia
);

// GET ALL
router.get(
  "/social-media",
  isAdmin,
  hasPermission("socialMedia", "view"),
  getAllSocialMedia
);

// UPDATE ONE
router.put(
  "/social-media/:platform",
  isAdmin,
  hasPermission("socialMedia", "edit"),
  updateSocialMedia
);

// DELETE ONE
router.delete(
  "/social-media/:platform",
  isAdmin,
  hasPermission("socialMedia", "delete"),
  deleteSocialMedia
);

module.exports = router;