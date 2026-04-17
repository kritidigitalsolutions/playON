const channelService = require("../services/channel.service");

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
    thumbnail: fileUrl(req, channel.thumbnail),
    logo: fileUrl(req, channel.logo)
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
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    if (channel.status !== "live") {
      return res.status(400).json({
        success: false,
        message: "Channel is offline"
      });
    }

    res.json({
      success: true,
      message: "Access granted",
      stream: {
        streamUrl: channel.streamUrl,
        streamType: channel.streamType
      },
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};