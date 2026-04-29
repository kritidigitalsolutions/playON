const cron = require("node-cron");
const Match = require("../models/match.model");
const autoNotify = require("../utils/autoNotify");

const startAutoLiveMatches = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const matches = await Match.find({
        status: "upcoming",
        matchDate: { $lte: now }
      });

      for (const match of matches) {
        match.status = "live";
        match.liveStartedAt = now;

        await match.save();

        await autoNotify({
          title: "Match Live Now",
          message: `${match.teamA} vs ${match.teamB} is live now.`,
          type: "MATCH",
          metadata: {
            matchId: match._id,
            image:
              match.banner ||
              match.thumbnail ||
              ""
          }
        });
      }

      if (matches.length > 0) {
        console.log(
          `${matches.length} match(es) auto started`
        );
      }

    } catch (error) {
      console.log(
        "Auto live match error:",
        error.message
      );
    }
  });
};

module.exports = startAutoLiveMatches;