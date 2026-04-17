const express = require("express");
const router = express.Router();

const {
  getMatches,
  getLiveMatches,
  getUpcomingMatches,
  getFeaturedMatches,
  getSingleMatch,
  watchMatch
} = require("../../controllers/match.controller");

const { isAuth } = require("../../middlewares/auth.middleware");
const { hasSubscription } = require("../../middlewares/subscription.middleware");

// Important: specific routes first
router.get("/live", getLiveMatches);
router.get("/upcoming", getUpcomingMatches);
router.get("/featured", getFeaturedMatches);

// List
router.get("/", getMatches);

// Single
router.get("/:id", getSingleMatch);

//watch
router.get("/:id/watch", isAuth, hasSubscription, watchMatch);

module.exports = router;