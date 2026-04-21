const Channel = require("../models/channel.model");

// Create
exports.createChannel = async (data) => {
  return await Channel.create(data);
};

// List
exports.getChannels = async (query) => {
  const {
    status,
    category,
    search,
    page = 1,
    limit = 10
  } = query;

  const filter = {};

  if (status) filter.status = status.toLowerCase();
  if (category) filter.category = category.toLowerCase();

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [channels, total] = await Promise.all([
    Channel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Channel.countDocuments(filter)
  ]);

  return {
    channels,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

// Single by ID
exports.getChannelById = async (id) => {
  return await Channel.findById(id);
};

// Single by Slug
exports.getChannelBySlug = async (slug) => {
  return await Channel.findOne({ slug });
};

// Update
exports.updateChannel = async (id, data) => {
  return await Channel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

// Delete
exports.deleteChannel = async (id) => {
  return await Channel.findByIdAndDelete(id);
};

// Go Live
exports.goLive = async (id) => {
  return await Channel.findByIdAndUpdate(
    id,
    { status: "live" },
    { new: true }
  );
};

// Go Offline
exports.goOffline = async (id) => {
  return await Channel.findByIdAndUpdate(
    id,
    { status: "offline" },
    { new: true }
  );
};

// Toggle Featured
exports.toggleFeatured = async (id) => {
  const channel = await Channel.findById(id);
  if (!channel) return null;

  channel.featured = !channel.featured;
  await channel.save();

  return channel;
};

// Public Live Channels
exports.getLiveChannels = async (query = {}) => {
  const { category, search } = query;

  const filter = {
    status: "live"
  };

  if (category && category !== "all") {
    filter.category = category.toLowerCase();
  }

  if (search) {
    filter.name = {
      $regex: search,
      $options: "i"
    };
  }

  return await Channel.find(filter).sort({
  featured: -1,
  createdAt: -1
});
};
exports.getWatchableChannel = async (id) => {
  return await Channel.findOne({
    _id: id,
    status: "live"
  });
};