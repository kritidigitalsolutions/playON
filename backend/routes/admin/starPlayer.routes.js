const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  createHighlight,
  getHighlights,
  getSingleHighlight,
  watchHighlight,
  updateHighlight,
  deleteHighlight
} = require("../../controllers/admin/starPlayer.controller");

const uploadSingle = upload.single("thumbnail");

// ----------------------------------------
// CREATE
// ----------------------------------------
router.post(
  "/",
  isAdmin,
  hasPermission("starplayer", "create"),
  uploadSingle,
  createHighlight
);

// ----------------------------------------
// GET ALL
// ----------------------------------------
router.get(
  "/",
  isAdmin,
  hasPermission("starplayer", "view"),
  getHighlights
);

// ----------------------------------------
// GET SINGLE
// ----------------------------------------
router.get(
  "/:id",
  isAdmin,
  hasPermission("starplayer", "view"),
  getSingleHighlight
);

// ----------------------------------------
// WATCH
// ----------------------------------------
router.get(
  "/watch/:id",
  isAdmin,
  hasPermission("starplayer", "view"),
  watchHighlight
);

// ----------------------------------------
// UPDATE
// ----------------------------------------
router.put(
  "/:id",
  isAdmin,
  hasPermission("starplayer", "edit"),
  uploadSingle,
  updateHighlight
);

// ----------------------------------------
// DELETE
// ----------------------------------------
router.delete(
  "/:id",
  isAdmin,
  hasPermission("starplayer", "delete"),
  deleteHighlight
);

module.exports = router;