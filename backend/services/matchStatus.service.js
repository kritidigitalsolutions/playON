const Match = require("../models/match.model");

const TERMINAL_STATUSES = new Set(["completed", "cancelled"]);

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeInputStatus = (status) =>
  status ? String(status).trim().toLowerCase() : "upcoming";

exports.normalizeStatusByMatchDate = (status, matchDate, now = new Date()) => {
  const normalizedStatus = normalizeInputStatus(status);
  const date = parseDate(matchDate);

  if (normalizedStatus === "cancelled") return "cancelled";
  if (!date) return normalizedStatus;

  if (date > now) return "upcoming";
  if (normalizedStatus === "completed") return "completed";
  if (normalizedStatus === "live") return "live";

  return "live";
};

exports.normalizeAdminStatus = (status, matchDate, now = new Date()) =>
  exports.normalizeStatusByMatchDate(status || "upcoming", matchDate, now);

exports.reconcileMatchStatuses = async (now = new Date()) => {
  const staleLiveCutoff = new Date(now.getTime() - 8 * 60 * 60 * 1000);
  const [futureResult, staleLiveResult, dueResult] = await Promise.all([
    Match.updateMany(
      {
        status: { $nin: ["upcoming", "cancelled"] },
        matchDate: { $gt: now }
      },
      {
        $set: {
          status: "upcoming",
          liveStartedAt: null,
          liveEndedAt: null
        }
      }
    ),
    Match.updateMany(
      {
        status: "live",
        matchDate: { $lte: staleLiveCutoff }
      },
      {
        $set: {
          status: "completed",
          liveEndedAt: now
        }
      }
    ),
    Match.updateMany(
      {
        status: "upcoming",
        matchDate: {
          $lte: now,
          $gt: staleLiveCutoff
        }
      },
      {
        $set: {
          status: "live",
          liveStartedAt: now
        }
      }
    )
  ]);

  return {
    futureFixed: futureResult.modifiedCount || 0,
    staleCompleted: staleLiveResult.modifiedCount || 0,
    started: dueResult.modifiedCount || 0
  };
};

exports.isTerminalStatus = (status) =>
  TERMINAL_STATUSES.has(normalizeInputStatus(status));
