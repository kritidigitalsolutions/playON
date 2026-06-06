const channelService = require("../services/channel.service");
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

const formatChannel = (req, doc) => {
  const channel = doc.toObject ? doc.toObject() : doc;

  return {
    ...channel,
    isPremium: !!channel.isPremium,
    thumbnail: fileUrl(req, channel.thumbnail),
    logo: fileUrl(req, channel.logo),
    liveLogo: fileUrl(req, channel.liveLogo)
  };
};

// GET /api/channels/live
exports.getLiveChannels = async (req, res) => {
  try {
    const channels = await channelService.getLiveChannels(
      req.query
    );

    res.json({
      success: true,
      count: channels.length,
      channels: channels.map((item) =>
        formatChannel(req, item)
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/channels/:slug
exports.getChannelBySlug = async (req, res) => {
  try {
    const channel = await channelService.getChannelBySlug(
      req.params.slug
    );

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    res.json({
      success: true,
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.watchChannel = async (req, res) => {
  try {
    const channel = await channelService.getChannelBySlug(req.params.slug);

    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    if (channel.status !== "live") {
      return res.status(400).json({ success: false, message: "Channel is offline" });
    }

    // ✅ PREMIUM GATE
    if (channel.isPremium) {
      const userId = getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: "Login required to watch premium content", locked: true, isPremium: true });
      }
      const hasAccess = await subscriptionService.checkAccess(userId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Active subscription required to watch this channel", locked: true, isPremium: true });
      }
    }

    res.json({
      success: true,
      message: "Access granted",
      stream: {
        streamUrl: channel.streamUrl,
        backupUrl: channel.backupUrl,
        rtmpUrl: channel.rtmpUrl,
        srtUrl: channel.srtUrl,
        streamType: channel.streamType
      },
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};