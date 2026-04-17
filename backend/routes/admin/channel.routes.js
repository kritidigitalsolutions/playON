const express = require("express");
const router = express.Router();

const upload = require("../../middlewares/upload.middleware");
const { isAdmin } = require("../../middlewares/admin.middleware");

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
  { name: "logo", maxCount: 1 }
]);

// Public
router.get("/live", getLiveChannels);
router.get("/slug/:slug", getChannelBySlug);

// Admin
router.post("/", isAdmin, channelUploads, createChannel);
router.get("/", isAdmin, getChannels);
router.get("/:id", isAdmin, getSingleChannel);
router.put("/:id", isAdmin, channelUploads, updateChannel);
router.delete("/:id", isAdmin, deleteChannel);
router.patch("/:id/live", isAdmin, goLive);
router.patch("/:id/offline", isAdmin, goOffline);
router.patch("/:id/feature", isAdmin, toggleFeatured);

router.get("/:id/watch", isAdmin, watchChannel);

module.exports = router;