const cron = require("node-cron");
const Match = require("../models/match.model");
const { syncAllHighlightlyMatches } = require("../services/highlightlySync.service");
const autoNotify = require("../utils/autoNotify");

const startAutoLiveMatches = () => {

  // ─── EVERY 10 MINUTES: Sync Highlightly data ──────────────────────────────
  // Budget math (example: 3 live + 2 upcoming matches):
  //   Live:     3 matches × 5 calls × 144 runs/day = 2,160 calls/day
  //   Upcoming: 2 matches × 1 call  ×  48 runs/day =    96 calls/day
  //   Total: ~2,256 calls/day
  //
  // If you're on the 100 req/day free tier, set this to "*/30 * * * *" instead.
  cron.schedule("*/10 * * * *", async () => {
    try {
      await syncAllHighlightlyMatches();
    } catch (error) {
      console.error("[CRON] Highlightly sync error:", error.message);
    }
  });

  // ─── EVERY 1 MINUTE: Auto-start manual matches (no Highlightly ID) ────────
  // Zero Highlightly API calls — only touches your own MongoDB.
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const manualMatches = await Match.find({
        status:              "upcoming",
        matchDate:           { $lte: now },
        highlightlyMatchId:  { $in: [null, ""] },
      });

      for (const match of manualMatches) {
        match.status       = "live";
        match.liveStartedAt = now;
        await match.save();
        console.log(`[AUTO] Match ${match._id} (${match.teamA} vs ${match.teamB}) set to live`);

        autoNotify({
          title:   "Match Live Now",
          message: `${match.teamA} vs ${match.teamB} is live now.`,
          type:    "MATCH",
          metadata: {
            matchId: match._id,
            image:   match.banner || match.thumbnail || "",
          },
        }).catch(() => {});
      }

      if (manualMatches.length > 0) {
        console.log(`[AUTO] ${manualMatches.length} manual match(es) started`);
      }
    } catch (error) {
      console.error("[CRON] Manual match error:", error.message);
    }
  });

  // ─── EVERY 30 MINUTES: Auto-complete stale live matches ───────────────────
  // Safety net — Highlightly sync should handle this via status mapping,
  // but this catches matches that have been live for unreasonably long.
  cron.schedule("*/30 * * * *", async () => {
    try {
      const now = new Date();
      const MAX_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

      const liveMatches = await Match.find({ status: "live" });

      for (const match of liveMatches) {
        if (!match.liveStartedAt) continue;

        const duration = now - match.liveStartedAt;
        if (duration > MAX_DURATION_MS) {
          match.status     = "completed";
          match.liveEndedAt = now;
          await match.save();
          console.log(`[AUTO] Match ${match._id} (${match.teamA} vs ${match.teamB}) auto-completed after 8h`);
        }
      }
    } catch (error) {
      console.error("[CRON] Auto-complete error:", error.message);
    }
  });

  console.log("✅ Auto Live Matches & Highlightly Sync started");
};

module.exports = startAutoLiveMatches;
