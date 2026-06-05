const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  createPodcast,
  getAllPodcasts,
  getSinglePodcast,
  updatePodcast,
  deletePodcast,
  toggleFeatured
} = require("../../controllers/admin/podcast.controller");

// upload config
const podcastUpload = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "liveLogo", maxCount: 1 }
]);

// CREATE
router.post(
  "/",
  isAdmin,
  hasPermission("podcasts", "create"),
  podcastUpload,
  createPodcast
);

// GET ALL
router.get(
  "/",
  isAdmin,
  hasPermission("podcasts", "view"),
  getAllPodcasts
);

// GET SINGLE
router.get(
  "/:id",
  isAdmin,
  hasPermission("podcasts", "view"),
  getSinglePodcast
);

// UPDATE
router.put(
  "/:id",
  isAdmin,
  hasPermission("podcasts", "edit"),
  podcastUpload,
  updatePodcast
);

// DELETE
router.delete(
  "/:id",
  isAdmin,
  hasPermission("podcasts", "delete"),
  deletePodcast
);

// TOGGLE FEATURED
router.patch(
  "/:id/feature",
  isAdmin,
  hasPermission("podcasts", "edit"),
  toggleFeatured
);

module.exports = router;