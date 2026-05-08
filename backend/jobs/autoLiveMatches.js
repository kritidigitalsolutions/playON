const cron = require("node-cron");
const Match = require("../models/match.model");
const { syncAllHighlightlyMatches } = require("../services/highlightlySync.service");
const matchStreamSync = require("../services/matchStreamSync.service");
const autoNotify = require("../utils/autoNotify");

const startAutoLiveMatches = () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      await syncAllHighlightlyMatches();
    } catch (error) {
      console.error("[CRON] Highlightly sync error:", error.message);
    }
  });

  // Every minute, fix impossible future statuses and start matches whose time arrived.
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const futureMatches = await Match.find({
        status: { $nin: ["upcoming", "cancelled"] },
        matchDate: { $gt: now }
      });

      for (const match of futureMatches) {
        match.status = "upcoming";
        match.liveStartedAt = null;
        match.liveEndedAt = null;
        await match.save();
        await matchStreamSync.syncForMatch(match, {}, { force: true });
        console.log(`[AUTO] Match ${match._id} (${match.teamA} vs ${match.teamB}) reset to upcoming`);
      }

      const dueMatches = await Match.find({
        status: "upcoming",
        matchDate: { $lte: now }
      });

      for (const match of dueMatches) {
        match.status = "live";
        match.liveStartedAt = match.liveStartedAt || now;
        await match.save();
        const stream = await matchStreamSync.syncForMatch(match, {}, {
          force: true,
          status: "live"
        });
        console.log(`[AUTO] Match ${match._id} (${match.teamA} vs ${match.teamB}) set to live`);

        autoNotify({
          title: "Match Live Now",
          message: `${match.teamA} vs ${match.teamB} is live now.`,
          type: "MATCH",
          metadata: {
            matchId: match._id,
            streamId: stream?._id,
            image: match.banner || match.thumbnail || ""
          }
        }).catch(() => {});
      }

      if (futureMatches.length > 0 || dueMatches.length > 0) {
        console.log(
          `[AUTO] statuses fixed: ${futureMatches.length}, started: ${dueMatches.length}`
        );
      }
    } catch (error) {
      console.error("[CRON] Match status error:", error.message);
    }
  });

  // Safety net: Highlightly sync should complete connected matches, this catches stale live ones.
  cron.schedule("*/30 * * * *", async () => {
    try {
      const now = new Date();
      const maxDurationMs = 8 * 60 * 60 * 1000;

      const liveMatches = await Match.find({ status: "live" });

      for (const match of liveMatches) {
        const startedAt = match.liveStartedAt || match.matchDate;
        if (!startedAt) continue;

        const duration = now - startedAt;
        if (duration > maxDurationMs) {
          match.status = "completed";
          match.liveEndedAt = now;
          await match.save();
          await matchStreamSync.endStreamForMatch(match._id);
          console.log(`[AUTO] Match ${match._id} (${match.teamA} vs ${match.teamB}) auto-completed after 8h`);
        }
      }
    } catch (error) {
      console.error("[CRON] Auto-complete error:", error.message);
    }
  });

  console.log("Auto Live Matches & Highlightly Sync started");
};

module.exports = startAutoLiveMatches;
