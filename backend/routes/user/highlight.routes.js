const express = require("express");

const router = express.Router();

const {
  getHighlightsByMatch,
  getSingleHighlight
} = require("../../controllers/highlight.controller");

// All highlights / filtered highlights
router.get(
  "/",
  getHighlightsByMatch
);

// Single highlight
router.get(
  "/:id",
  getSingleHighlight
);

module.exports = router;