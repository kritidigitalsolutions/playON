const express = require("express");
const router = express.Router();


const {
  getLiveStreams,
  getStreamByMatch,
  getSingleStream
} = require("../../controllers/stream.controller");
const { isAuth } = require("../../middlewares/auth.middleware");

// Specific routes first
router.get("/live",isAuth ,getLiveStreams);
router.get("/match/:matchId",isAuth, getStreamByMatch);

// Single
// router.get("/:id",isAuth, getSingleStream);

module.exports = router;