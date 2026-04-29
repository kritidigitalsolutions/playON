const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
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
router.post(
  "/",
  isAdmin,
  hasPermission("matches", "create"),
  playerUpload,
  createPlayer
);

// List
router.get(
  "/",
  isAdmin,
  hasPermission("matches", "view"),
  getPlayers
);

// Single
router.get(
  "/:id",
  isAdmin,
  hasPermission("matches", "view"),
  getSinglePlayer
);

// Update
router.put(
  "/:id",
  isAdmin,
  hasPermission("matches", "edit"),
  playerUpload,
  updatePlayer
);

// Delete
router.delete(
  "/:id",
  isAdmin,
  hasPermission("matches", "delete"),
  deletePlayer
);

// Toggle Featured
router.patch(
  "/:id/feature",
  isAdmin,
  hasPermission("matches", "edit"),
  toggleFeatured
);

module.exports = router;