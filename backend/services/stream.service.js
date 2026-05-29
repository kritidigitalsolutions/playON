const Stream = require("../models/stream.model");

// Create Stream
exports.createStream = async (data) => {
  return await Stream.create(data);
};

// Admin List (filters + pagination)
exports.getStreams = async (query) => {
  const {
    status,
    provider,
    matchId,
    search,
    page = 1,
    limit = 10
  } = query;

  const filter = {};

  if (status) filter.status = status.toLowerCase();
  if (provider) filter.provider = provider;
  if (matchId) filter.matchId = matchId;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { provider: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [streams, total] = await Promise.all([
    Stream.find(filter)
      .populate("matchId", "title teamA teamB sport status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Stream.countDocuments(filter)
  ]);

  return {
    streams,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

// Single Stream
exports.getStreamById = async (id) => {
  return await Stream.findById(id).populate(
    "matchId",
    "title teamA teamB sport status"
  );
};

// Update Stream
exports.updateStream = async (id, data) => {
  return await Stream.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  }).populate("matchId", "title teamA teamB sport status");
};

// Delete Stream
exports.deleteStream = async (id) => {
  return await Stream.findByIdAndDelete(id);
};

// Go Live
exports.goLive = async (id) => {
  return await Stream.findByIdAndUpdate(
    id,
    {
      status: "live",
      startedAt: new Date(),
      endedAt: null,
      health: "good"
    },
    { new: true }
  ).populate("matchId", "title teamA teamB sport status");
};

// End Stream
exports.endStream = async (id) => {
  return await Stream.findByIdAndUpdate(
    id,
    {
      status: "ended",
      endedAt: new Date()
    },
    { new: true }
  ).populate("matchId", "title teamA teamB sport status");
};

// Update Viewer Count
exports.updateViewerCount = async (id, count) => {
  return await Stream.findByIdAndUpdate(
    id,
    { viewerCount: count },
    { new: true }
  );
};

// Public Live Streams
exports.getLiveStreams = async () => {
  return await Stream.find({ status: "live" })
    .populate("matchId", "title teamA teamB sport score status banner")
    .sort({ startedAt: -1 });
};

// Match Stream
exports.getStreamByMatch = async (matchId) => {
  return await Stream.findOne({ matchId })
    .sort({ createdAt: -1 })
    .populate("matchId", "title teamA teamB sport score status");
};
