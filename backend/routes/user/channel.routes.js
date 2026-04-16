const express = require("express");
const router = express.Router();

const {
  getLiveChannels,
  getChannelBySlug
} = require("../../controllers/channel.controller");

router.get("/live", getLiveChannels);
router.get("/:slug", getChannelBySlug);

module.exports = router;