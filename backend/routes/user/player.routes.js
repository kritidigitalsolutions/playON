const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");

const {
  getPlayers,
  getFeaturedPlayers,
  getPlayerBySlug,
  toggleFollowPlayer,
  getMyFollowedPlayers
} = require("../../controllers/player.controller");

// Specific routes first
router.get("/featured", getFeaturedPlayers);

// Protected routes
router.get("/following/me", isAuth, getMyFollowedPlayers);
router.post("/:id/toggle-follow", isAuth, toggleFollowPlayer);

// Public routes
router.get("/", getPlayers);
router.get("/:slug", getPlayerBySlug);

module.exports = router;