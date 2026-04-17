const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");
const { hasSubscription } = require("../../middlewares/subscription.middleware");

const {
  getLiveChannels,
  getChannelBySlug,
  watchChannel
} = require("../../controllers/channel.controller");

router.get("/live", getLiveChannels);
router.get("/:slug", getChannelBySlug);
router.get("/:slug/watch", isAuth, hasSubscription, watchChannel);

module.exports = router;