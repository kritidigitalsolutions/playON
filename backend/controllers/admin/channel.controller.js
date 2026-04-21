const channelService = require("../../services/channel.service");
const uploadToFirebase = require("../../utils/uploadToFirebase");

const makeSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

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

// Create
exports.createChannel = async (req, res) => {
  try {
    const streamType =
      req.body.streamType ||
      (req.body.streamUrl?.includes(".m3u8") ? "hls" : "other");

    let thumbnail = "";
    let logo = "";

    if (req.files?.thumbnail?.[0]) {
      thumbnail = await uploadToFirebase(
        req.files.thumbnail[0],
        "channels"
      );
    }

    if (req.files?.logo?.[0]) {
      logo = await uploadToFirebase(
        req.files.logo[0],
        "channels"
      );
    }

    const data = {
      ...req.body,
      slug: makeSlug(req.body.name),
      streamType,
      thumbnail,
      logo,
      createdBy: req.admin?._id || null
    };

    const channel = await channelService.createChannel(data);

    res.status(201).json({
      success: true,
      message: "Channel created successfully",
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// List
exports.getChannels = async (req, res) => {
  try {
    const result = await channelService.getChannels(req.query);

    res.json({
      success: true,
      ...result,
      channels: result.channels.map((item) =>
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

// Single by ID
exports.getSingleChannel = async (req, res) => {
  try {
    const channel = await channelService.getChannelById(req.params.id);

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

// Single by Slug
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

// Update
exports.updateChannel = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.body.name) {
      data.slug = makeSlug(req.body.name);
    }

    if (req.body.streamUrl && !req.body.streamType) {
      data.streamType = req.body.streamUrl.includes(".m3u8")
        ? "hls"
        : "other";
    }

    if (req.files?.thumbnail?.[0]) {
      data.thumbnail = await uploadToFirebase(
        req.files.thumbnail[0],
        "channels"
      );
    }

    if (req.files?.logo?.[0]) {
      data.logo = await uploadToFirebase(
        req.files.logo[0],
        "channels"
      );
    }

    const channel = await channelService.updateChannel(
      req.params.id,
      data
    );

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    res.json({
      success: true,
      message: "Channel updated successfully",
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete
exports.deleteChannel = async (req, res) => {
  try {
    const channel = await channelService.deleteChannel(
      req.params.id
    );

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    res.json({
      success: true,
      message: "Channel deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Live
exports.goLive = async (req, res) => {
  try {
    const channel = await channelService.goLive(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    res.json({
      success: true,
      message: "Channel is live",
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Offline
exports.goOffline = async (req, res) => {
  try {
    const channel = await channelService.goOffline(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    res.json({
      success: true,
      message: "Channel is offline",
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle Featured
exports.toggleFeatured = async (req, res) => {
  try {
    const channel = await channelService.toggleFeatured(
      req.params.id
    );

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    res.json({
      success: true,
      message: "Featured updated",
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Public Live Channels
exports.getLiveChannels = async (req, res) => {
  try {
    const channels = await channelService.getLiveChannels();

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

// Watch
exports.watchChannel = async (req, res) => {
  try {
    const channel = await channelService.getChannelById(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found"
      });
    }

    res.json({
      success: true,
      preview: true,
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