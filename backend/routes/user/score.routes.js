const express = require("express");
const router = express.Router();

const {
  getLiveScores,
  getScoreByMatch,
    getScoreboard,
    getPlayers,
    getEvents,
    getTopPerformers,
    getStats,
    getHighlights
} = require("../../controllers/score.controller");

router.get("/live", getLiveScores);
router.get("/:matchId", getScoreByMatch);
router.get("/:matchId/scoreboard", getScoreboard);
router.get("/:matchId/players", getPlayers);  
router.get("/:matchId/events", getEvents);
router.get("/:matchId/top-performers", getTopPerformers);
router.get("/:matchId/stats", getStats);
router.get("/:matchId/highlights", getHighlights);

module.exports = router;