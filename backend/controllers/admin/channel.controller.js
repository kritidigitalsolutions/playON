const channelService = require("../../services/channel.service");
const uploadToFirebase = require("../../utils/uploadToFirebase");
const deleteFromFirebase = require("../../utils/deleteFromFirebase");
const autoNotify = require("../../utils/autoNotify");

const makeSlug = (text = "") =>
  text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

const fileUrl = (req, filePath) => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
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

// Upload helper — throws with a clear message on failure
const uploadFile = async (file, folder, label) => {
  try {
    return await uploadToFirebase(file, folder);
  } catch (err) {
    throw new Error(`${label} upload failed: ${err.message}`);
  }
};

// Create
exports.createChannel = async (req, res) => {
  try {
    const body = { ...req.body };

    const streamType =
      body.streamType ||
      (body.streamUrl?.includes(".m3u8") ? "hls" : "other");

    const uploadPromises = [];
    const uploadKeys = [];

    if (req.files?.thumbnail?.[0]) {
      uploadPromises.push(uploadFile(req.files.thumbnail[0], "channels", "Thumbnail"));
      uploadKeys.push("thumbnail");
    }

    if (req.files?.logo?.[0]) {
      uploadPromises.push(uploadFile(req.files.logo[0], "channels", "Logo"));
      uploadKeys.push("logo");
    }

    const uploadedUrls = await Promise.all(uploadPromises);

    let thumbnail = "";
    let logo = "";

    uploadKeys.forEach((key, index) => {
      if (key === "thumbnail") thumbnail = uploadedUrls[index];
      if (key === "logo") logo = uploadedUrls[index];
    });

    const data = {
      ...body,
      slug: makeSlug(body.name),
      streamType,
      thumbnail,
      logo,
      createdBy: req.admin?._id || null
    };

    const channel = await channelService.createChannel(data);

    await autoNotify({
      title: "New Channel Added",
      message: `${channel.name} is now available.`,
      type: "CHANNEL",
      metadata: {
        channelId: channel._id,
        image: channel.thumbnail || channel.logo || ""
      }
    }).catch((err) =>
      console.error("[autoNotify] createChannel failed:", err.message)
    );

    res.status(201).json({
      success: true,
      message: "Channel created successfully",
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    console.error("[createChannel]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// List
exports.getChannels = async (req, res) => {
  try {
    const result = await channelService.getChannels(req.query);
    res.json({
      success: true,
      ...result,
      channels: result.channels.map((item) => formatChannel(req, item))
    });
  } catch (error) {
    console.error("[getChannels]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Single by ID
exports.getSingleChannel = async (req, res) => {
  try {
    const channel = await channelService.getChannelById(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }
    res.json({ success: true, channel: formatChannel(req, channel) });
  } catch (error) {
    console.error("[getSingleChannel]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Single by Slug
exports.getChannelBySlug = async (req, res) => {
  try {
    const channel = await channelService.getChannelBySlug(req.params.slug);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }
    res.json({ success: true, channel: formatChannel(req, channel) });
  } catch (error) {
    console.error("[getChannelBySlug]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update
exports.updateChannel = async (req, res) => {
  try {
    const data = { ...req.body };


    if (req.body.name) data.slug = makeSlug(req.body.name);

    if (req.body.streamUrl && !req.body.streamType) {
      data.streamType = req.body.streamUrl.includes(".m3u8") ? "hls" : "other";
    }

    if (req.files?.thumbnail?.[0] || req.files?.logo?.[0]) {
      const existing = await channelService.getChannelById(req.params.id);

      const deletePromises = [];
      const uploadPromises = [];
      const uploadKeys = [];

      if (req.files?.thumbnail?.[0]) {
        if (existing?.thumbnail) {
          deletePromises.push(deleteFromFirebase(existing.thumbnail).catch(() => { }));
        }
        uploadPromises.push(uploadFile(req.files.thumbnail[0], "channels", "Thumbnail"));
        uploadKeys.push("thumbnail");
      }

      if (req.files?.logo?.[0]) {
        if (existing?.logo) {
          deletePromises.push(deleteFromFirebase(existing.logo).catch(() => { }));
        }
        uploadPromises.push(uploadFile(req.files.logo[0], "channels", "Logo"));
        uploadKeys.push("logo");
      }

      const [_, uploadedUrls] = await Promise.all([
        Promise.all(deletePromises),
        Promise.all(uploadPromises)
      ]);

      uploadKeys.forEach((key, index) => {
        data[key] = uploadedUrls[index];
      });
    }

    const channel = await channelService.updateChannel(req.params.id, data);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    res.json({
      success: true,
      message: "Channel updated successfully",
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    console.error("[updateChannel]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete
exports.deleteChannel = async (req, res) => {
  try {
    const channel = await channelService.getChannelById(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    if (channel.thumbnail) await deleteFromFirebase(channel.thumbnail).catch(() => { });
    if (channel.logo) await deleteFromFirebase(channel.logo).catch(() => { });

    await channelService.deleteChannel(req.params.id);

    res.json({ success: true, message: "Channel deleted successfully" });
  } catch (error) {
    console.error("[deleteChannel]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Go Live
exports.goLive = async (req, res) => {
  try {
    const channel = await channelService.goLive(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    await autoNotify({
      title: "Channel Live Now",
      message: `${channel.name} is live now.`,
      type: "CHANNEL",
      metadata: { channelId: channel._id, image: channel.thumbnail || channel.logo || "" }
    }).catch((err) => console.error("[autoNotify] goLive failed:", err.message));

    res.json({ success: true, message: "Channel is live", channel: formatChannel(req, channel) });
  } catch (error) {
    console.error("[goLive]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Go Offline
exports.goOffline = async (req, res) => {
  try {
    const channel = await channelService.goOffline(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    await autoNotify({
      title: "Channel Offline",
      message: `${channel.name} is now offline.`,
      type: "CHANNEL",
      metadata: { channelId: channel._id, image: channel.thumbnail || channel.logo || "" }
    }).catch((err) => console.error("[autoNotify] goOffline failed:", err.message));

    res.json({ success: true, message: "Channel is offline", channel: formatChannel(req, channel) });
  } catch (error) {
    console.error("[goOffline]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Featured
exports.toggleFeatured = async (req, res) => {
  try {
    const channel = await channelService.toggleFeatured(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }
    res.json({ success: true, message: "Featured updated", channel: formatChannel(req, channel) });
  } catch (error) {
    console.error("[toggleFeatured]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public Live Channels
exports.getLiveChannels = async (req, res) => {
  try {
    const channels = await channelService.getLiveChannels(req.query); // fixed: was passing nothing
    res.json({
      success: true,
      count: channels.length,
      channels: channels.map((item) => formatChannel(req, item))
    });
  } catch (error) {
    console.error("[getLiveChannels]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Watch
exports.watchChannel = async (req, res) => {
  try {
    const channel = await channelService.getChannelById(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }
    if (channel.status !== "live") {
      return res.status(400).json({ success: false, message: "Channel is offline" });
    }
    res.json({
      success: true,
      preview: true,
      stream: { streamUrl: channel.streamUrl, streamType: channel.streamType },
      channel: formatChannel(req, channel)
    });
  } catch (error) {
    console.error("[watchChannel]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};