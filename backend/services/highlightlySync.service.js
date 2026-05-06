const Match = require("../models/match.model");
const highlightly = require("./providers/highlightly.provider");

/**
 * Sync match status from Highlightly API with database
 * Maps Highlightly state to DB status
 */
exports.syncHighlightlyMatchStatus = async (dbMatch) => {
  try {
    // If no Highlightly ID linked, skip sync
    if (!dbMatch.highlightlyMatchId) {
      return { synced: false, reason: "No Highlightly ID" };
    }

    // Fetch live data from Highlightly
    const highlightlyMatch = await highlightly.getMatchById(
      dbMatch.highlightlyMatchId,
      dbMatch.highlightlySport || dbMatch.sport
    );

    if (!highlightlyMatch) {
      return { synced: false, reason: "Match not found on Highlightly" };
    }

    // Map Highlightly status to DB status
    const newStatus = mapHighlightlyStatus(highlightlyMatch.status);
    const shouldUpdate = newStatus !== dbMatch.status;

    if (shouldUpdate) {
      console.log(
        `[SYNC] Match ${dbMatch._id}: ${dbMatch.status} → ${newStatus}`
      );

      dbMatch.status = newStatus;

      // Update timestamps based on status
      if (newStatus === "live" && !dbMatch.liveStartedAt) {
        dbMatch.liveStartedAt = new Date();
      }

      if (newStatus === "completed" && !dbMatch.liveEndedAt) {
        dbMatch.liveEndedAt = new Date();
      }

      // Store Highlightly metadata for reference
      dbMatch.highlightlyLastSync = new Date();
      dbMatch.highlightlyStatus = highlightlyMatch.status; // Keep original status

      await dbMatch.save();

      return {
        synced: true,
        oldStatus: dbMatch.status,
        newStatus: newStatus,
        message: `Status synced from Highlightly`
      };
    }

    return { synced: false, reason: "Status unchanged" };
  } catch (error) {
    console.error(
      `[SYNC ERROR] Match ${dbMatch._id}:`,
      error.message
    );
    return { synced: false, error: error.message };
  }
};

/**
 * Map Highlightly API status to DB status
 */
function mapHighlightlyStatus(highlightlyStatus) {
  const statusMap = {
    // Highlightly status → DB status
    "Live": "live",
    "In Progress": "live",
    "inprogress": "live",
    "live": "live",
    
    "Upcoming": "upcoming",
    "upcoming": "upcoming",
    "Not Started": "upcoming",
    "scheduled": "upcoming",
    
    "Completed": "completed",
    "completed": "completed",
    "Finished": "completed",
    "Final": "completed",
    "ended": "completed",
    
    "Postponed": "postponed",
    "postponed": "postponed",
    "Delayed": "postponed",
    
    "Cancelled": "cancelled",
    "cancelled": "cancelled",
    "Abandoned": "cancelled"
  };

  return statusMap[highlightlyStatus] || "upcoming";
}

/**
 * Sync all matches linked to Highlightly
 * Run this periodically (every 1-5 minutes)
 */
exports.syncAllHighlightlyMatches = async () => {
  try {
    // Find all matches with Highlightly ID
    const matches = await Match.find({
      highlightlyMatchId: { $exists: true, $ne: null }
    });

    if (matches.length === 0) {
      return { total: 0, synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const match of matches) {
      const result = await exports.syncHighlightlyMatchStatus(match);
      if (result.synced) synced++;
      else if (result.error) failed++;
    }

    console.log(
      `[HIGHLIGHT SYNC] Total: ${matches.length}, Synced: ${synced}, Failed: ${failed}`
    );

    return { total: matches.length, synced, failed };
  } catch (error) {
    console.error("[SYNC ALL ERROR]:", error.message);
    return { total: 0, synced: 0, failed: 0, error: error.message };
  }
};