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

const starPlayerUpload = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "liveLogo", maxCount: 1 }
]);

// ----------------------------------------
// CREATE
// ----------------------------------------
router.post(
  "/",
  isAdmin,
  hasPermission("starplayer", "create"),
  starPlayerUpload,
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
  starPlayerUpload,
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