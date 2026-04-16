const Player = require("../models/player.model");

// Create
exports.createPlayer = async (data) => {
  return await Player.create(data);
};

// Admin List
exports.getPlayers = async (query = {}) => {
  const {
    sport,
    team,
    status,
    search,
    page = 1,
    limit = 10
  } = query;

  const filter = {};

  if (sport) filter.sport = sport;
  if (team) filter.team = team;
  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { team: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [players, total] = await Promise.all([
    Player.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Player.countDocuments(filter)
  ]);

  return {
    players,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

// Single by ID
exports.getPlayerById = async (id) => {
  return await Player.findById(id);
};

// Single by Slug
exports.getPlayerBySlug = async (slug) => {
  return await Player.findOne({ slug });
};

// Update
exports.updatePlayer = async (id, data) => {
  return await Player.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

// Delete
exports.deletePlayer = async (id) => {
  return await Player.findByIdAndDelete(id);
};

// Toggle Featured
exports.toggleFeatured = async (id) => {
  const player = await Player.findById(id);
  if (!player) return null;

  player.featured = !player.featured;
  await player.save();

  return player;
};

// Public Featured
exports.getFeaturedPlayers = async () => {
  return await Player.find({
    featured: true,
    status: "active"
  }).sort({ createdAt: -1 });
};

// Public List
exports.getPublicPlayers = async (query = {}) => {
  const { sport, team, search } = query;

  const filter = {
    status: "active"
  };

  if (sport) filter.sport = sport;
  if (team) filter.team = team;

  if (search) {
    filter.name = {
      $regex: search,
      $options: "i"
    };
  }

  return await Player.find(filter).sort({
    createdAt: -1
  });
};