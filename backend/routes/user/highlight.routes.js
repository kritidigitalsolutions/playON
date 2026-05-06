const express = require("express");
const router = express.Router();

const { getHighlightsByMatch } = require("../../controllers/highlight.controller");

// GET /api/highlights?matchId=xxx
router.get("/", getHighlightsByMatch);

module.exports = router;
