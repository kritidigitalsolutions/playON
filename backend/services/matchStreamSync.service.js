const Stream = require("../models/stream.model");

const STREAM_FIELD_KEYS = [
  "streamTitle",
  "streamProvider",
  "streamUrl",
  "streamBackupUrl",
  "streamType",
  "streamQuality",
  "streamStatus",
  "streamScheduledAt",
  "streamNotes",
  "streamIsPremium"
];

const STREAM_PAYLOAD_KEYS = [
  "streamTitle",
  "streamProvider",
  "streamUrl",
  "streamBackupUrl",
  "streamType",
  "streamQuality",
  "streamIsPremium"
];

const STREAM_STATUSES_BY_MATCH_STATUS = {
  live: "live",
  completed: "ended",
  cancelled: "offline",
  upcoming: "scheduled"
};

const isPresent = (value) => value !== undefined && value !== null;

const asString = (value) => (isPresent(value) ? String(value).trim() : undefined);

const parseBoolean = (value, fallback = false) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
};

const parseDate = (value, fallback = null) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const getBodyValue = (body, streamKey, legacyKey) => {
  if (Object.prototype.hasOwnProperty.call(body, streamKey)) return body[streamKey];
  if (legacyKey && Object.prototype.hasOwnProperty.call(body, legacyKey)) return body[legacyKey];
  return undefined;
};

const getStreamTitle = (match = {}) =>
  match.title || `${match.teamA || "Team A"} vs ${match.teamB || "Team B"}`;

const statusForMatch = (matchStatus) => STREAM_STATUSES_BY_MATCH_STATUS[matchStatus] || "scheduled";

exports.stripStreamFields = (data = {}) => {
  const clean = { ...data };
  STREAM_FIELD_KEYS.forEach((key) => delete clean[key]);
  return clean;
};

exports.hasStreamPayload = (body = {}) =>
  STREAM_PAYLOAD_KEYS.some((key) => Object.prototype.hasOwnProperty.call(body, key));

exports.getLatestStreamByMatch = (matchId) =>
  Stream.findOne({ matchId }).sort({ createdAt: -1 });

exports.getStreamsByMatchIds = async (matchIds = []) => {
  const streams = await Stream.find({ matchId: { $in: matchIds } }).sort({ createdAt: -1 });
  const map = new Map();

  streams.forEach((stream) => {
    const key = String(stream.matchId);
    if (!map.has(key)) map.set(key, stream);
  });

  return map;
};

exports.syncForMatch = async (match, body = {}, options = {}) => {
  if (!match?._id) return null;

  const existing = await exports.getLatestStreamByMatch(match._id);
  const hasStreamPayload = exports.hasStreamPayload(body);
  const incomingStreamUrl = asString(getBodyValue(body, "streamUrl", "streamUrl"));
  const effectiveStreamUrl = incomingStreamUrl || existing?.streamUrl || "";

  if (options.requireStreamUrl && !effectiveStreamUrl) {
    const error = new Error("Stream URL is required before going live");
    error.statusCode = 400;
    throw error;
  }

  if (!existing && !hasStreamPayload && !options.force) return null;
  if (!existing && !effectiveStreamUrl) return null;

  const streamStatus =
    options.status ||
    statusForMatch(match.status);
  const isLive = streamStatus === "live";
  const isEnded = streamStatus === "ended";

  const data = {
    matchId: match._id,
    title: asString(getBodyValue(body, "streamTitle", "title")) ?? existing?.title ?? getStreamTitle(match),
    provider: asString(getBodyValue(body, "streamProvider", "provider")) ?? existing?.provider ?? "",
    streamUrl: effectiveStreamUrl,
    backupUrl: asString(getBodyValue(body, "streamBackupUrl", "backupUrl")) ?? existing?.backupUrl ?? "",
    streamType: asString(getBodyValue(body, "streamType", "streamType")) ?? existing?.streamType ?? "hls",
    quality: asString(getBodyValue(body, "streamQuality", "quality")) ?? existing?.quality ?? "auto",
    status: streamStatus,
    scheduledAt: parseDate(match.matchDate, null),
    notes: "",
    isPremium: parseBoolean(getBodyValue(body, "streamIsPremium", "isPremium"), Boolean(match.isPremium)),
    thumbnail: match.thumbnail || "",
    health: isLive ? "good" : existing?.health || "unknown",
    startedAt: isLive ? existing?.startedAt || new Date() : existing?.startedAt || null,
    endedAt: isEnded ? new Date() : streamStatus === "live" ? null : existing?.endedAt || null
  };

  if (options.createdBy && !existing) {
    data.createdBy = options.createdBy;
  }

  if (existing) {
    existing.set(data);
    return existing.save();
  }

  return Stream.create(data);
};

exports.markStreamLiveForMatch = (match, body = {}) =>
  exports.syncForMatch(match, body, {
    force: true,
    requireStreamUrl: true,
    status: "live"
  });

exports.endStreamForMatch = async (matchId) =>
  Stream.findOneAndUpdate(
    { matchId },
    {
      status: "ended",
      endedAt: new Date()
    },
    { new: true, sort: { createdAt: -1 } }
  );

exports.deleteStreamsForMatch = (matchId) => Stream.deleteMany({ matchId });
