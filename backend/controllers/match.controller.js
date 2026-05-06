const matchService = require("../services/match.service");
const matchStreamSync = require("../services/matchStreamSync.service");
const subscriptionService = require("../services/subscription.service");
const jwt = require("jsonwebtoken");

const getUserIdFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    return decoded?.userId || null;
  } catch { return null; }
};

// helpers
const fileUrl = (req, filePath) => {
  if (!filePath) return "";

  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {
    return filePath;
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return `${baseUrl}/${filePath.replace(/\\/g, "/")}`;
};

const formatStream = (doc) => {
  if (!doc) return null;
  const s = doc.toObject ? doc.toObject() : doc;
  return {
    _id: s._id,
    title: s.title,
    provider: s.provider,
    streamUrl: s.streamUrl,
    backupUrl: s.backupUrl,
    streamType: s.streamType,
    quality: s.quality,
    status: s.status,
    viewerCount: s.viewerCount,
    health: s.health,
    isPremium: !!s.isPremium,
    scheduledAt: s.scheduledAt,
    startedAt: s.startedAt,
    endedAt: s.endedAt
  };
};

const formatMatch = (req, doc, stream = null) => {
  const match = doc.toObject ? doc.toObject() : doc;

  return {
    ...match,
    isPremium: !!match.isPremium,
    thumbnail: fileUrl(req, match.thumbnail),
    banner: fileUrl(req, match.banner),
    teamALogo: fileUrl(req, match.teamALogo),
    teamBLogo: fileUrl(req, match.teamBLogo),
    stream: formatStream(stream)
  };
};

// All Matches
exports.getMatches = async (req, res) => {
  try {
    const result = await matchService.getPublicMatches(req.query);
    const streamMap = await matchStreamSync.getStreamsByMatchIds(
      result.matches.map((m) => m._id)
    );

    res.json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      matches: result.matches.map((item) =>
        formatMatch(req, item, streamMap.get(String(item._id)) || null)
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Live Matches
exports.getLiveMatches = async (req, res) => {
  try {
    const matches = await matchService.getByStatus("live");
    const streamMap = await matchStreamSync.getStreamsByMatchIds(
      matches.map((m) => m._id)
    );

    res.json({
      success: true,
      count: matches.length,
      matches: matches.map((item) =>
        formatMatch(req, item, streamMap.get(String(item._id)) || null)
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Upcoming Matches
exports.getUpcomingMatches = async (req, res) => {
  try {
    const matches = await matchService.getByStatus("upcoming");
    const streamMap = await matchStreamSync.getStreamsByMatchIds(
      matches.map((m) => m._id)
    );

    res.json({
      success: true,
      count: matches.length,
      matches: matches.map((item) =>
        formatMatch(req, item, streamMap.get(String(item._id)) || null)
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Featured Matches
exports.getFeaturedMatches = async (req, res) => {
  try {
    const matches = await matchService.getFeatured();
    const streamMap = await matchStreamSync.getStreamsByMatchIds(
      matches.map((m) => m._id)
    );

    res.json({
      success: true,
      count: matches.length,
      matches: matches.map((item) =>
        formatMatch(req, item, streamMap.get(String(item._id)) || null)
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Single Match
exports.getSingleMatch = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    const stream = await matchStreamSync.getLatestStreamByMatch(req.params.id);

    res.json({
      success: true,
      match: formatMatch(req, match, stream || null)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//watch match
exports.watchMatch = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id);

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }
    if (match.status !== "live") {
      return res.status(400).json({ success: false, message: "Match is not live yet" });
    }

    // ✅ PREMIUM GATE
    if (match.isPremium) {
      const userId = getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: "Login required to watch premium content", locked: true, isPremium: true });
      }
      const hasAccess = await subscriptionService.checkAccess(userId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Active subscription required to watch this match", locked: true, isPremium: true });
      }
    }

    const stream = await matchStreamSync.getLatestStreamByMatch(req.params.id);

    if (!stream || !stream.streamUrl) {
      return res.status(404).json({ success: false, message: "No stream URL found for this match" });
    }
    if (stream.status !== "live") {
      return res.status(400).json({ success: false, message: "Stream is not live yet" });
    }

    res.json({
      success: true,
      message: "Access granted",
      stream: {
        streamUrl: stream.streamUrl,
        streamType: stream.streamType,
        backupUrl: stream.backupUrl,
        quality: stream.quality
      },
      match: formatMatch(req, match, stream)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
