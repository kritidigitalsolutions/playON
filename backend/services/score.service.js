const highlightly = require("./providers/highlightly.provider");
const mock = require("./providers/mock.provider");
const Match = require("../models/match.model");
const { syncMatch } = require("./highlightlySync.service");

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 min

// ─── Helpers ──────────────────────────────────────────────────

async function resolveMatch(matchId) {
  const match = await Match.findById(matchId).lean();
  return match || null;
}

/**
 * Read a cached field from highlightlyData stored in MongoDB.
 * If the data is stale and the match is live, fires a background sync
 * so the NEXT request gets fresher data (without blocking this one).
 */
function getCachedData(match, field) {
  const data = match.highlightlyData;
  if (!data) return null;

  // Background sync if stale — fire and forget, never await
  if (match.highlightlyMatchId && match.status === "live") {
    if (match.highlightlyLastSync) {
      const age = Date.now() - new Date(match.highlightlyLastSync).getTime();
      if (age > STALE_THRESHOLD_MS) {
        syncMatch(match).catch(() => {});
      }
    }
  }

  return data[field] ?? null;
}

// ─── 1. Live Scores ───────────────────────────────────────────
exports.getLiveScores = async () => {
  try {
    const liveMatches = await Match.find({ status: "live" }).lean();
    if (!liveMatches.length) return [];

    return liveMatches.map((m) => {
      const cached = m.highlightlyData?.match;
      return {
        matchId:    m._id,
        title:      `${m.teamA} vs ${m.teamB}`,
        sport:      m.sport,
        status:     m.status,
        homeTeam:   cached?.homeTeam   || m.teamA,
        awayTeam:   cached?.awayTeam   || m.teamB,
        homeLogo:   cached?.homeLogo   || m.teamALogo || "",
        awayLogo:   cached?.awayLogo   || m.teamBLogo || "",
        homeScore:  cached?.homeScore  || "",
        awayScore:  cached?.awayScore  || "",
        report:     cached?.report     || "",
        league:     cached?.league     || m.tournament || "",
        format:     cached?.format     || "",
        thumbnail:  m.thumbnail        || "",
        syncedAt:   m.highlightlyLastSync || null,
      };
    });
  } catch (err) {
    console.error("getLiveScores error:", err.message);
    return mock.getLiveMatches();
  }
};

// ─── 2. Score By Match ────────────────────────────────────────
exports.getScoreByMatch = async (matchId) => {
  try {
    const match = await resolveMatch(matchId);
    if (!match) return null;

    if (match.highlightlyMatchId) {
      return getCachedData(match, "match") || {
        matchId,
        homeTeam:  match.teamA,
        awayTeam:  match.teamB,
        status:    match.status,
      };
    }
    return mock.getMatchById(matchId);
  } catch (err) {
    console.error("getScoreByMatch error:", err.message);
    return mock.getMatchById(matchId);
  }
};

// ─── 3. Scoreboard ────────────────────────────────────────────
exports.getScoreboard = async (matchId) => {
  try {
    const match = await resolveMatch(matchId);
    if (!match) return null;

    if (match.highlightlyMatchId) {
      return getCachedData(match, "scoreboard");
    }
    return mock.getScoreboard(matchId);
  } catch (err) {
    console.error("getScoreboard error:", err.message);
    return mock.getScoreboard(matchId);
  }
};

// ─── 4. Players ───────────────────────────────────────────────
// Squad/lineup rarely changes mid-match — fetched once, stored permanently.
exports.getPlayers = async (matchId) => {
  try {
    const match = await resolveMatch(matchId);
    if (!match) return null;

    if (match.highlightlyMatchId) {
      // Serve from cache if available
      if (match.highlightlyData?.players) {
        return match.highlightlyData.players;
      }

      // First request: fetch from API and store
      const data = await highlightly.getPlayers(
        match.highlightlyMatchId,
        match.highlightlySport || match.sport
      );

      if (data) {
        await Match.findByIdAndUpdate(match._id, {
          $set: { "highlightlyData.players": data },
        });
      }

      return data;
    }
    return mock.getPlayers(matchId);
  } catch (err) {
    console.error("getPlayers error:", err.message);
    return mock.getPlayers(matchId);
  }
};

// ─── 5. Stats ─────────────────────────────────────────────────
exports.getStats = async (matchId) => {
  try {
    const match = await resolveMatch(matchId);
    if (!match) return null;

    if (match.highlightlyMatchId) {
      return getCachedData(match, "stats");
    }
    return mock.getStats(matchId);
  } catch (err) {
    console.error("getStats error:", err.message);
    return mock.getStats(matchId);
  }
};

// ─── 6. Top Performers ────────────────────────────────────────
exports.getTopPerformers = async (matchId) => {
  try {
    const match = await resolveMatch(matchId);
    if (!match) return null;

    if (match.highlightlyMatchId) {
      return getCachedData(match, "topPerformers");
    }
    return mock.getTopPerformers(matchId);
  } catch (err) {
    console.error("getTopPerformers error:", err.message);
    return mock.getTopPerformers(matchId);
  }
};

// ─── 7. Events ────────────────────────────────────────────────
exports.getEvents = async (matchId) => {
  try {
    const match = await resolveMatch(matchId);
    if (!match) return null;

    if (match.highlightlyMatchId) {
      return getCachedData(match, "events");
    }
    return mock.getEvents(matchId);
  } catch (err) {
    console.error("getEvents error:", err.message);
    return mock.getEvents(matchId);
  }
};

// ─── 8. Highlights ────────────────────────────────────────────
// Highlights don't change mid-match — re-fetched only every 30 min.
exports.getHighlights = async (matchId) => {
  try {
    const match = await resolveMatch(matchId);
    if (!match) return null;

    if (match.highlightlyMatchId) {
      const HIGHLIGHTS_TTL = 30 * 60 * 1000;

      if (match.highlightlyData?.highlights) {
        const syncedAt = match.highlightlyData.highlightsSyncedAt;
        const age = syncedAt
          ? Date.now() - new Date(syncedAt).getTime()
          : Infinity;

        if (age < HIGHLIGHTS_TTL) {
          return match.highlightlyData.highlights;
        }
      }

      // Cache miss or expired — fetch and store
      const data = await highlightly.getHighlights(
        match.highlightlyMatchId,
        match.highlightlySport || match.sport
      );

      if (data) {
        await Match.findByIdAndUpdate(match._id, {
          $set: {
            "highlightlyData.highlights":           data,
            "highlightlyData.highlightsSyncedAt":   new Date(),
          },
        });
      }

      return data;
    }
    return mock.getHighlights(matchId);
  } catch (err) {
    console.error("getHighlights error:", err.message);
    return mock.getHighlights(matchId);
  }
};

// ─── 9. Search ────────────────────────────────────────────────
// This is an admin/utility call — hits API directly, no cache needed.
exports.searchHighlightlyMatches = async (sport, date) => {
  try {
    return await highlightly.searchMatches(sport, date);
  } catch (err) {
    console.error("searchHighlightlyMatches error:", err.message);
    return [];
  }
};
