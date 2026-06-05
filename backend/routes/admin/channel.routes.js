const express = require("express");
const router = express.Router();

const upload = require("../../middlewares/upload.middleware");
const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");

const {
  createChannel,
  getChannels,
  getSingleChannel,
  getChannelBySlug,
  updateChannel,
  deleteChannel,
  goLive,
  goOffline,
  toggleFeatured,
  getLiveChannels,watchChannel
} = require("../../controllers/admin/channel.controller");

const channelUploads = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "logo", maxCount: 1 },
  { name: "liveLogo", maxCount: 1 }
]);

// Public
router.get("/live", getLiveChannels);
router.get("/slug/:slug", getChannelBySlug);

// Admin
router.post(
  "/",
  isAdmin,
  hasPermission("channels", "create"),
  channelUploads,
  createChannel
);
router.get(
  "/",
  isAdmin,
  hasPermission("channels", "view"),
  getChannels
);
router.get(
  "/:id",
  isAdmin,
  hasPermission("channels", "view"),
  getSingleChannel
);
router.put(
  "/:id",
  isAdmin,
  hasPermission("channels", "edit"),
  channelUploads,
  updateChannel
);
router.delete(
  "/:id",
  isAdmin,
  hasPermission("channels", "delete"),
  deleteChannel
);
router.patch(
  "/:id/live",
  isAdmin,
  hasPermission("channels", "edit"),
  goLive
);
router.patch(
  "/:id/offline",
  isAdmin,
  hasPermission("channels", "edit"),
  goOffline
);
router.patch(
  "/:id/feature",
  isAdmin,
  hasPermission("channels", "edit"),
  toggleFeatured
);

router.get(
  "/:id/watch",
  isAdmin,
  hasPermission("channels", "view"),
  watchChannel
);

module.exports = router;