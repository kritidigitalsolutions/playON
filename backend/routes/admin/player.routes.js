const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  createPlayer,
  getPlayers,
  getSinglePlayer,
  updatePlayer,
  deletePlayer,
  toggleFeatured
} = require("../../controllers/admin/player.controller");

const playerUpload = upload.single("image");

// Create
router.post("/", isAdmin, playerUpload, createPlayer);

// List
router.get("/", isAdmin, getPlayers);

// Single
router.get("/:id", isAdmin, getSinglePlayer);

// Update
router.put("/:id", isAdmin, playerUpload, updatePlayer);

// Delete
router.delete("/:id", isAdmin, deletePlayer);

// Toggle Featured
router.patch("/:id/feature", isAdmin, toggleFeatured);

module.exports = router;