const streamService = require("../services/stream.service");
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

// helper
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

const formatStream = (req, doc) => {
  const stream = doc.toObject ? doc.toObject() : doc;

  return {
    ...stream,
    isPremium: !!stream.isPremium,
    thumbnail: fileUrl(req, stream.thumbnail)
  };
};

// All Live Streams
exports.getLiveStreams = async (req, res) => {
  try {
    const streams = await streamService.getLiveStreams();

    res.json({
      success: true,
      count: streams.length,
      streams: streams.map((item) => formatStream(req, item))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Stream By Match
exports.getStreamByMatch = async (req, res) => {
  try {
    const stream = await streamService.getStreamByMatch(req.params.matchId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "No stream found for this match"
      });
    }

    res.json({
      success: true,
      stream: formatStream(req, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Single Stream
// exports.getSingleStream = async (req, res) => {
//   try {
//     const stream = await streamService.getStreamById(req.params.id);

//     if (!stream) {
//       return res.status(404).json({
//         success: false,
//         message: "Stream not found"
//       });
//     }

//     res.json({
//       success: true,
//       stream: formatStream(req, stream)
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

exports.playStream = async (req, res) => {
  try {
    const stream = await streamService.getStreamByMatch(req.params.matchId);

    if (!stream) {
      return res.status(404).json({ success: false, message: "No stream found" });
    }

    if (stream.status !== "live") {
      return res.status(400).json({ success: false, message: "Stream is not live" });
    }

    // ✅ PREMIUM GATE
    if (stream.isPremium) {
      const userId = getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: "Login required to watch premium content", locked: true, isPremium: true });
      }
      const hasAccess = await subscriptionService.checkAccess(userId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Active subscription required to watch this stream", locked: true, isPremium: true });
      }
    }

    res.json({
      success: true,
      message: "Access granted",
      stream: formatStream(req, stream)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};