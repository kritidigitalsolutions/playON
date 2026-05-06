// const cron = require("node-cron");
// const Match = require("../models/match.model");
// const autoNotify = require("../utils/autoNotify");

// const startAutoLiveMatches = () => {
//   cron.schedule("* * * * *", async () => {
//     try {
//       const now = new Date();

//       const matches = await Match.find({
//         status: "upcoming",
//         matchDate: { $lte: now }
//       });

//       for (const match of matches) {
//         match.status = "live";
//         match.liveStartedAt = now;

//         await match.save();

//         await autoNotify({
//           title: "Match Live Now",
//           message: `${match.teamA} vs ${match.teamB} is live now.`,
//           type: "MATCH",
//           metadata: {
//             matchId: match._id,
//             image:
//               match.banner ||
//               match.thumbnail ||
//               ""
//           }
//         });
//       }

//       if (matches.length > 0) {
//         console.log(
//           `${matches.length} match(es) auto started`
//         );
//       }

//     } catch (error) {
//       console.log(
//         "Auto live match error:",
//         error.message
//       );
//     }
//   });
// };

// module.exports = startAutoLiveMatches;

const cron = require("node-cron");
const Match = require("../models/match.model");
const { syncAllHighlightlyMatches } = require("../services/highlightlySync.service");

const startAutoLiveMatches = () => {
  // ─── EVERY 1 MINUTE: Sync Highlightly matches ───────────────────
  cron.schedule("* * * * *", async () => {
    try {
      // Sync matches linked to Highlightly API
      await syncAllHighlightlyMatches();

      // Also handle manual matches (without Highlightly ID)
      const now = new Date();
      const manualMatches = await Match.find({
        status: "upcoming",
        matchDate: { $lte: now },
        highlightlyMatchId: { $in: [null, ""] } // Manual matches only
      });

      for (const match of manualMatches) {
        match.status = "live";
        match.liveStartedAt = now;
        await match.save();
        console.log(`[AUTO] Match ${match._id} set to live`);
      }

      if (manualMatches.length > 0) {
        console.log(`[AUTO] ${manualMatches.length} manual match(es) auto started`);
      }
    } catch (error) {
      console.error("Auto live match error:", error.message);
    }
  });

  // ─── EVERY 5 MINUTES: Complete finished matches ──────────────────
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const liveMatches = await Match.find({ status: "live" });

      for (const match of liveMatches) {
        // If match hasn't been live for more than expected time, auto-complete
        if (match.liveStartedAt) {
          const duration = now - match.liveStartedAt;
          const maxDuration = 8 * 60 * 60 * 1000; // 8 hours max for a match

          if (duration > maxDuration) {
            match.status = "completed";
            match.liveEndedAt = now;
            await match.save();
            console.log(`[AUTO] Match ${match._id} auto-completed`);
          }
        }
      }
    } catch (error) {
      console.error("Auto complete match error:", error.message);
    }
  });

  console.log("✅ Auto Live Matches & Highlightly Sync started");
};

module.exports = startAutoLiveMatches;