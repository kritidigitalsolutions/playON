const express = require("express");
const router = express.Router();

const {
  getMatches,
  getLiveMatches,
  getUpcomingMatches,
  getFeaturedMatches,
  getSingleMatch
} = require("../../controllers/match.controller");

// Important: specific routes first
router.get("/live", getLiveMatches);
router.get("/upcoming", getUpcomingMatches);
router.get("/featured", getFeaturedMatches);

// List
router.get("/", getMatches);

// Single
router.get("/:id", getSingleMatch);

module.exports = router;