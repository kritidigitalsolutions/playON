const Channel = require("../models/channel.model");
const ensureChannelNumbers = require("../utils/ensureChannelNumbers");
const {
  getNextChannelNumber,
  syncChannelNumberCounter
} = require("../utils/channelNumber");

// Run once at startup; resets on failure so it can be retried
let ensurePromise = null;

const ensureChannelNumbersOnce = async () => {
  if (!ensurePromise) {
    ensurePromise = ensureChannelNumbers().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  return ensurePromise;
};

const isDuplicateChannelNumberError = (error) =>
  error?.code === 11000 &&
  (error?.keyPattern?.channelNumber ||
    error?.keyValue?.channelNumber);

// =====================================================
// CREATE CHANNEL
// =====================================================
exports.createChannel = async (data) => {
  await ensureChannelNumbersOnce();

  // =========================================
  // MANUAL CHANNEL NUMBER
  // =========================================
  if (data.channelNumber !== undefined) {
    const manualNumber = Number(data.channelNumber);

    if (isNaN(manualNumber) || manualNumber <= 0) {
      throw new Error("Invalid channel number");
    }

    const exists = await Channel.findOne({
      channelNumber: manualNumber
    });

    if (exists) {
      throw new Error("Channel number already exists");
    }

    return await Channel.create({
      ...data,
      channelNumber: manualNumber
    });
  }

  // =========================================
  // AUTO CHANNEL NUMBER
  // =========================================
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let channelNumber;

    try {
      channelNumber = await getNextChannelNumber();
    } catch (counterError) {
      await syncChannelNumberCounter();
      channelNumber = await getNextChannelNumber();
    }

    if (!channelNumber || channelNumber <= 0) {
      throw new Error(
        `Invalid channel number generated: ${channelNumber}`
      );
    }

    try {
      return await Channel.create({
        ...data,
        channelNumber
      });
    } catch (error) {
      if (!isDuplicateChannelNumberError(error)) {
        throw error;
      }
    }
  }

  throw new Error(
    "Unable to allocate a unique channel number after 5 attempts"
  );
};

// =====================================================
// GET CHANNELS
// =====================================================
exports.getChannels = async (query) => {
  await ensureChannelNumbersOnce();

  const {
    status,
    category,
    search,
    page = 1,
    limit = 10
  } = query;

  const filter = {};

  if (status) filter.status = status.toLowerCase();

  if (category) {
    filter.category = category.toLowerCase();
  }

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i"
        }
      },
      {
        slug: {
          $regex: search,
          $options: "i"
        }
      }
    ];

    if (!isNaN(search)) {
      filter.$or.push({
        channelNumber: Number(search)
      });
    }
  }

  const skip =
    (Number(page) - 1) * Number(limit);

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
      pages: Math.ceil(
        total / Number(limit)
      )
    }
  };
};

// =====================================================
// SINGLE BY ID
// =====================================================
exports.getChannelById = async (id) =>
  Channel.findById(id);

// =====================================================
// SINGLE BY SLUG
// =====================================================
exports.getChannelBySlug = async (slug) =>
  Channel.findOne({ slug });

// =====================================================
// UPDATE CHANNEL
// =====================================================
exports.updateChannel = async (id, data) => {

  // =========================================
  // MANUAL CHANNEL NUMBER UPDATE
  // =========================================
  if (data.channelNumber !== undefined) {

    const manualNumber = Number(data.channelNumber);

    if (isNaN(manualNumber) || manualNumber <= 0) {
      throw new Error("Invalid channel number");
    }

    const existing = await Channel.findOne({
      channelNumber: manualNumber,
      _id: { $ne: id }
    });

    if (existing) {
      throw new Error("Channel number already exists");
    }

    data.channelNumber = manualNumber;
  }

  return await Channel.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true
    }
  );
};

// =====================================================
// DELETE CHANNEL
// =====================================================
exports.deleteChannel = async (id) =>
  Channel.findByIdAndDelete(id);

// =====================================================
// GO LIVE
// =====================================================
exports.goLive = async (id) =>
  Channel.findByIdAndUpdate(
    id,
    { status: "live" },
    { new: true }
  );

// =====================================================
// GO OFFLINE
// =====================================================
exports.goOffline = async (id) =>
  Channel.findByIdAndUpdate(
    id,
    { status: "offline" },
    { new: true }
  );

// =====================================================
// TOGGLE FEATURED
// =====================================================
exports.toggleFeatured = async (id) => {
  const channel = await Channel.findById(id);

  if (!channel) return null;

  channel.featured = !channel.featured;

  await channel.save();

  return channel;
};

// =====================================================
// PUBLIC LIVE CHANNELS
// =====================================================
exports.getLiveChannels = async (
  query = {}
) => {
  await ensureChannelNumbersOnce();

  const { category, search } = query;

  const filter = {
    status: "live"
  };

  if (category && category !== "all") {
    filter.category = category.toLowerCase();
  }

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i"
        }
      },
      {
        slug: {
          $regex: search,
          $options: "i"
        }
      }
    ];

    if (!isNaN(search)) {
      filter.$or.push({
        channelNumber: Number(search)
      });
    }
  }

  return Channel.find(filter).sort({
    featured: -1,
    channelNumber: 1
  });
};

// =====================================================
// WATCHABLE CHANNEL
// =====================================================
exports.getWatchableChannel = async (id) =>
  Channel.findOne({
    _id: id,
    status: "live"
  });