const Channel = require("../models/channel.model");
const ensureChannelNumbers = require("../utils/ensureChannelNumbers");
const { getNextChannelNumber, syncChannelNumberCounter } = require("../utils/channelNumber");

// Run once at startup; resets on failure so it can be retried
let ensurePromise = null;

const ensureChannelNumbersOnce = async () => {
  if (!ensurePromise) {
    ensurePromise = ensureChannelNumbers().catch((error) => {
      ensurePromise = null; // allow retry on next request
      throw error;
    });
  }
  return ensurePromise;
};

const isDuplicateChannelNumberError = (error) =>
  error?.code === 11000 &&
  (error?.keyPattern?.channelNumber || error?.keyValue?.channelNumber);

// Create
exports.createChannel = async (data) => {
  await ensureChannelNumbersOnce();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    let channelNumber;
    try {
      channelNumber = await getNextChannelNumber();
    } catch (counterError) {
      // Counter itself failed — sync and retry once
      await syncChannelNumberCounter();
      channelNumber = await getNextChannelNumber();
    }

    if (!channelNumber || channelNumber <= 0) {
      throw new Error(
        `Invalid channel number generated: ${channelNumber}`
      );
    }

    try {
      return await Channel.create({ ...data, channelNumber });
    } catch (error) {
      if (!isDuplicateChannelNumberError(error)) {
        throw error;
      }
      // Duplicate — loop and get next number
    }
  }

  throw new Error("Unable to allocate a unique channel number after 5 attempts");
};

// List
exports.getChannels = async (query) => {
  await ensureChannelNumbersOnce();

  const { status, category, search, page = 1, limit = 10 } = query;

  const filter = {};

  if (status) filter.status = status.toLowerCase();
  if (category) filter.category = category.toLowerCase();

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } }
    ];
    if (!isNaN(search)) {
      filter.$or.push({ channelNumber: Number(search) });
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [channels, total] = await Promise.all([
    Channel.find(filter)
      .sort({ channelNumber: 1 })
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
exports.getChannelById = async (id) => Channel.findById(id);

// Single by Slug
exports.getChannelBySlug = async (slug) => Channel.findOne({ slug });

// Update
exports.updateChannel = async (id, data) =>
  Channel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

// Delete
exports.deleteChannel = async (id) => Channel.findByIdAndDelete(id);

// Go Live
exports.goLive = async (id) =>
  Channel.findByIdAndUpdate(id, { status: "live" }, { new: true });

// Go Offline
exports.goOffline = async (id) =>
  Channel.findByIdAndUpdate(id, { status: "offline" }, { new: true });

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
  await ensureChannelNumbersOnce();

  const { category, search } = query;

  const filter = { status: "live" };

  if (category && category !== "all") {
    filter.category = category.toLowerCase();
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } }
    ];
    if (!isNaN(search)) {
      filter.$or.push({ channelNumber: Number(search) });
    }
  }

  return Channel.find(filter).sort({ featured: -1, channelNumber: 1 });
};

// Watchable Channel
exports.getWatchableChannel = async (id) =>
  Channel.findOne({ _id: id, status: "live" });