const Team = require("../models/team.model");

// Create
exports.createTeam = async (data) => {
  return await Team.create(data);
};

// Admin List
exports.getTeams = async (query) => {
  const {
    search,
    sport,
    isActive,
    page = 1,
    limit = 20
  } = query;

  const filter = {};

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  if (sport) {
    filter.sport = sport.toLowerCase();
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [teams, total] = await Promise.all([
    Team.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Team.countDocuments(filter)
  ]);

  return {
    teams,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

// Public Active Teams
exports.getActiveTeams = async (query) => {
  const filter = { isActive: true };

  if (query.sport) {
    filter.sport = query.sport.toLowerCase();
  }

  return await Team.find(filter).sort({
    sortOrder: 1,
    name: 1
  });
};

// Single
exports.getById = async (id) => {
  return await Team.findById(id);
};

// Update
exports.updateTeam = async (id, data) => {
  return await Team.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

// Delete
exports.deleteTeam = async (id) => {
  return await Team.findByIdAndDelete(id);
};

// Toggle
exports.toggleStatus = async (id) => {
  const team = await Team.findById(id);
  if (!team) return null;

  team.isActive = !team.isActive;
  await team.save();

  return team;
};