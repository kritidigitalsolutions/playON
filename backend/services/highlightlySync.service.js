const Match = require("../models/match.model");
const highlightly = require("./providers/highlightly.provider");
const { normalizeStatusByMatchDate } = require("./matchStatus.service");

// ─── Config ───────────────────────────────────────────────────
const SYNC_COOLDOWN_LIVE_MS = 5 * 60 * 1000; // 5 min  for live matches
const SYNC_COOLDOWN_UPCOMING_MS = 30 * 60 * 1000; // 30 min for upcoming matches
const REQUEST_DELAY_MS = 500;             // 0.5s between API calls

// ─── Helpers ──────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Map Highlightly status string → your DB status enum
 */
function mapHighlightlyStatus(highlightlyStatus) {
  const map = {
    Live: "live",
    "In Progress": "live",
    inprogress: "live",
    live: "live",

    Upcoming: "upcoming",
    upcoming: "upcoming",
    "Not Started": "upcoming",
    scheduled: "upcoming",
    Scheduled: "upcoming",

    Completed: "completed",
    completed: "completed",
    Finished: "completed",
    finished: "completed",
    Final: "completed",
    final: "completed",
    FT: "completed",
    "Full Time": "completed",
    ended: "completed",
    Ended: "completed",

    Postponed: "cancelled",
    postponed: "cancelled",
    Delayed: "cancelled",

    Cancelled: "cancelled",
    cancelled: "cancelled",
    Abandoned: "cancelled",
  };
  return map[highlightlyStatus] ?? null;
}

/**
 * Is this match's cached data too old to serve?
 */
function isStale(match) {
  if (!match.highlightlyLastSync) return true;
  const age = Date.now() - new Date(match.highlightlyLastSync).getTime();
  const cooldown =
    match.status === "live" ? SYNC_COOLDOWN_LIVE_MS : SYNC_COOLDOWN_UPCOMING_MS;
  return age > cooldown;
}

// ─── Core: sync one match ─────────────────────────────────────

/**
 * Fetch fresh data from Highlightly and persist everything to MongoDB.
 * Returns a result object — never throws.
 *
 * @param {Object} dbMatch  - Mongoose document (not .lean())
 * @param {Object} options
 * @param {boolean} options.fullSync - if false, only sync status (for upcoming)
 */
async function syncOneMatch(dbMatch, { fullSync = true } = {}) {
  const matchLabel = `${dbMatch.teamA} vs ${dbMatch.teamB} (${dbMatch._id})`;

  if (!dbMatch.highlightlyMatchId) {
    return { synced: false, reason: "No Highlightly ID" };
  }

  try {
    // ── Fetch core match data ──────────────────────────────────
    const liveData = await highlightly.getMatchById(
      dbMatch.highlightlyMatchId,
      dbMatch.highlightlySport || dbMatch.sport
    );

    if (!liveData) {
      return { synced: false, reason: "No data returned from Highlightly" };
    }

    const providerStatus = mapHighlightlyStatus(liveData.status);
    const newStatus =
      providerStatus === "completed" || providerStatus === "cancelled"
        ? providerStatus
        : normalizeStatusByMatchDate(
          providerStatus ?? dbMatch.status,
          liveData.matchDate || liveData.date || dbMatch.matchDate
        );
    const oldStatus = dbMatch.status;

    const updates = {
      highlightlyStatus: liveData.status,
      highlightlyLastSync: new Date(),
      "highlightlyData.match": liveData,
      "highlightlyData.syncedAt": new Date(),
    };

    // ── Status transitions ─────────────────────────────────────
    if (newStatus && newStatus !== oldStatus) {
      console.log(`[SYNC] ${matchLabel}: ${oldStatus} → ${newStatus}`);
      updates.status = newStatus;

      if (newStatus === "live" && !dbMatch.liveStartedAt) {
        updates.liveStartedAt = new Date();
      }
      if (newStatus === "completed" && !dbMatch.liveEndedAt) {
        updates.liveEndedAt = new Date();
      }
    }

    // ── Full sync: fetch scoreboard, stats, events, performers ─
    if (fullSync) {
      const [scoreboard, stats, topPerformers, events] =
        await Promise.allSettled([
          highlightly.getScoreboard(
            dbMatch.highlightlyMatchId,
            dbMatch.highlightlySport || dbMatch.sport
          ),
          highlightly.getStats(
            dbMatch.highlightlyMatchId,
            dbMatch.highlightlySport || dbMatch.sport
          ),
          highlightly.getTopPerformers(
            dbMatch.highlightlyMatchId,
            dbMatch.highlightlySport || dbMatch.sport
          ),
          highlightly.getEvents(
            dbMatch.highlightlyMatchId,
            dbMatch.highlightlySport || dbMatch.sport
          ),
        ]);

      const ok = (r) => (r.status === "fulfilled" && r.value ? r.value : null);

      if (ok(scoreboard)) updates["highlightlyData.scoreboard"] = ok(scoreboard);
      if (ok(stats)) updates["highlightlyData.stats"] = ok(stats);
      if (ok(topPerformers)) updates["highlightlyData.topPerformers"] = ok(topPerformers);
      if (ok(events)) updates["highlightlyData.events"] = ok(events);
    }

    await Match.findByIdAndUpdate(dbMatch._id, { $set: updates });

    return {
      synced: true,
      oldStatus,
      newStatus: newStatus ?? oldStatus,
      fullSync,
    };
  } catch (err) {
    console.error(`[SYNC ERROR] ${matchLabel}:`, err.message);
    return { synced: false, error: err.message };
  }
}

// ─── Public: sync a single match (called from score.service) ──

/**
 * External entry point for on-demand / background sync of one match.
 * Respects the cooldown so rapid user requests don't multiply API calls.
 *
 * @param {Object} dbMatch - Mongoose document or lean object with _id
 */
exports.syncMatch = async (dbMatch) => {
  const doc =
    typeof dbMatch.save === "function"
      ? dbMatch
      : await Match.findById(dbMatch._id);

  if (!doc) return { synced: false, reason: "Match not found" };
  if (!isStale(doc)) return { synced: false, reason: "Sync cooldown active" };

  return syncOneMatch(doc, { fullSync: doc.status === "live" });
};

// ─── Public: bulk sync called by cron ─────────────────────────

/**
 * Sync all live + upcoming matches linked to Highlightly.
 * - Live matches:      full sync (status + scoreboard + stats + events + performers)
 * - Upcoming matches:  status-only sync
 * - Completed matches: skipped entirely
 *
 * Adds a small delay between calls to avoid burst rate limiting.
 */
exports.syncAllHighlightlyMatches = async () => {
  try {
    const matches = await Match.find({
      highlightlyMatchId: { $nin: [null, ""] },
      status: { $in: ["live", "upcoming"] },
    });

    if (!matches.length) {
      return { total: 0, synced: 0, skipped: 0, failed: 0 };
    }

    // Prioritise live matches first
    const sorted = [
      ...matches.filter((m) => m.status === "live"),
      ...matches.filter((m) => m.status === "upcoming"),
    ];

    let synced = 0, skipped = 0, failed = 0;

    for (const match of sorted) {
      if (!isStale(match)) {
        skipped++;
        continue;
      }

      const fullSync = match.status === "live";
      const result = await syncOneMatch(match, { fullSync });

      if (result.synced) synced++;
      else if (result.error) failed++;
      else skipped++;

      await sleep(REQUEST_DELAY_MS);
    }

    console.log(
      `[SYNC] Done — total: ${sorted.length}, synced: ${synced}, skipped: ${skipped}, failed: ${failed}`
    );

    return { total: sorted.length, synced, skipped, failed };
  } catch (err) {
    console.error("[SYNC ALL ERROR]:", err.message);
    return { total: 0, synced: 0, skipped: 0, failed: 0, error: err.message };
  }
};
