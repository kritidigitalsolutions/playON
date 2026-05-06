// const provider = require("./providers/mock.provider");

// exports.getLiveScores = async () => {
//   return await provider.getLiveMatches();
// };

// exports.getScoreByMatch = async (matchId) => {
//   return await provider.getMatchById(matchId);
// };

// exports.getScoreboard = async (matchId) => {
//   return await provider.getScoreboard(matchId);
// };

// exports.getPlayers = async (matchId) => {
//   return await provider.getPlayers(matchId);
// };

// exports.getEvents = async (matchId) => {
//   return await provider.getEvents(matchId);
// };

// exports.getTopPerformers = async (matchId) => {
//   return await provider.getTopPerformers(matchId);
// };

// exports.getStats = async (matchId) => {
//   return await provider.getStats(matchId);
// };

// exports.getHighlights = async (matchId) => {
//   return await provider.getHighlights(matchId);
// };

const highlightly = require("./providers/highlightly.provider");
const mock = require("./providers/mock.provider");
const Match = require("../models/match.model");

// Helper: get the Highlightly match ID and sport from your DB match
async function resolveMatch(matchId) {
  const match = await Match.findById(matchId).lean();
  if (!match) return null;
  return {
    highlightlyId: match.highlightlyMatchId,
    sport: match.highlightlySport || match.sport || "cricket",
    match
  };
}

// ─── 1. Live Scores ────────────────────────────────────────────
exports.getLiveScores = async () => {
  try {
    // Get all live matches from your DB
    const liveMatches = await Match.find({ status: "live" }).lean();
    if (!liveMatches.length) return [];

    // For matches with a Highlightly ID, fetch live data
    const results = await Promise.allSettled(
      liveMatches.map(async (m) => {
        if (m.highlightlyMatchId) {
          const data = await highlightly.getMatchById(
            m.highlightlyMatchId,
            m.highlightlySport || m.sport
          );
          return {
            matchId: m._id,
            highlightlyMatchId: m.highlightlyMatchId,
            title: `${m.teamA} vs ${m.teamB}`,
            sport: m.sport,
            status: data?.status || m.status,
            score: data?.score || data?.result || "",
            data
          };
        }
        // Fallback to mock if no Highlightly ID linked
        return mock.getMatchById(String(m._id)) || {
          matchId: m._id,
          title: `${m.teamA} vs ${m.teamB}`,
          sport: m.sport,
          status: m.status
        };
      })
    );

    return results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);
  } catch (err) {
    console.error("getLiveScores error:", err.message);
    return mock.getLiveMatches();
  }
};

// ─── 2. Score By Match ─────────────────────────────────────────
exports.getScoreByMatch = async (matchId) => {
  try {
    const resolved = await resolveMatch(matchId);
    if (!resolved) return null;

    if (resolved.highlightlyId) {
      return await highlightly.getMatchById(resolved.highlightlyId, resolved.sport);
    }
    return mock.getMatchById(matchId);
  } catch (err) {
    console.error("getScoreByMatch error:", err.message);
    return mock.getMatchById(matchId);
  }
};

// ─── 3. Scoreboard ─────────────────────────────────────────────
exports.getScoreboard = async (matchId) => {
  try {
    const resolved = await resolveMatch(matchId);
    if (!resolved) return null;

    if (resolved.highlightlyId) {
      return await highlightly.getScoreboard(resolved.highlightlyId, resolved.sport);
    }
    return mock.getScoreboard(matchId);
  } catch (err) {
    console.error("getScoreboard error:", err.message);
    return mock.getScoreboard(matchId);
  }
};

// ─── 4. Current Players ────────────────────────────────────────
exports.getPlayers = async (matchId) => {
  try {
    const resolved = await resolveMatch(matchId);
    if (!resolved) return null;

    if (resolved.highlightlyId) {
      return await highlightly.getPlayers(resolved.highlightlyId, resolved.sport);
    }
    return mock.getPlayers(matchId);
  } catch (err) {
    console.error("getPlayers error:", err.message);
    return mock.getPlayers(matchId);
  }
};

// ─── 5. Match Stats ────────────────────────────────────────────
exports.getStats = async (matchId) => {
  try {
    const resolved = await resolveMatch(matchId);
    if (!resolved) return null;

    if (resolved.highlightlyId) {
      return await highlightly.getStats(resolved.highlightlyId, resolved.sport);
    }
    return mock.getStats(matchId);
  } catch (err) {
    console.error("getStats error:", err.message);
    return mock.getStats(matchId);
  }
};

// ─── 6. Top Performers ─────────────────────────────────────────
exports.getTopPerformers = async (matchId) => {
  try {
    const resolved = await resolveMatch(matchId);
    if (!resolved) return null;

    if (resolved.highlightlyId) {
      return await highlightly.getTopPerformers(resolved.highlightlyId, resolved.sport);
    }
    return mock.getTopPerformers(matchId);
  } catch (err) {
    console.error("getTopPerformers error:", err.message);
    return mock.getTopPerformers(matchId);
  }
};

// ─── 7. Text Events ────────────────────────────────────────────
exports.getEvents = async (matchId) => {
  try {
    const resolved = await resolveMatch(matchId);
    if (!resolved) return null;

    if (resolved.highlightlyId) {
      return await highlightly.getEvents(resolved.highlightlyId, resolved.sport);
    }
    return mock.getEvents(matchId);
  } catch (err) {
    console.error("getEvents error:", err.message);
    return mock.getEvents(matchId);
  }
};

// ─── 8. Video Highlights ───────────────────────────────────────
exports.getHighlights = async (matchId) => {
  try {
    const resolved = await resolveMatch(matchId);
    if (!resolved) return null;

    if (resolved.highlightlyId) {
      return await highlightly.getHighlights(resolved.highlightlyId, resolved.sport);
    }
    return mock.getHighlights(matchId);
  } catch (err) {
    console.error("getHighlights error:", err.message);
    return mock.getHighlights(matchId);
  }
};

// ─── 9. Search Highlightly Matches ──────────────────────────────
exports.searchHighlightlyMatches = async (sport, date) => {
  try {
    return await highlightly.searchMatches(sport, date);
  } catch (err) {
    console.error("searchHighlightlyMatches error:", err.message);
    return [];
  }
};
