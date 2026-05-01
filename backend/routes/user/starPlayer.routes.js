const express = require("express");
const router = express.Router();

const {
  getStarPlayers,
  getFeaturedStarPlayers,
  getSingleStarPlayer
} = require("../../controllers/starPlayer.controller");

// ----------------------------------------
// GET ALL STAR PLAYERS
// ----------------------------------------
router.get("/", getStarPlayers);

// ----------------------------------------
// GET FEATURED STAR PLAYERS
// ----------------------------------------
router.get("/featured", getFeaturedStarPlayers);

// ----------------------------------------
// GET SINGLE STAR PLAYER
// ----------------------------------------
router.get("/:id", getSingleStarPlayer);

module.exports = router;