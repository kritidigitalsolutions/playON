const express = require("express");
const router = express.Router();
const { hasSubscription } = require("../../middlewares/subscription.middleware");

const {
  getLiveStreams,
  getStreamByMatch,
  getSingleStream,
  playStream  
} = require("../../controllers/stream.controller");
const { isAuth } = require("../../middlewares/auth.middleware");


// Specific routes first
router.get("/live",isAuth ,getLiveStreams);
router.get("/match/:matchId",isAuth, getStreamByMatch);



router.get("/match/:matchId/watch", isAuth, hasSubscription, playStream);

// Single
// router.get("/:id",isAuth, getSingleStream);

module.exports = router;