const Match = require("../models/match.model");

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Create
exports.createMatch = async (data) => {
  return await Match.create(data);
};

// Admin List (with filters + pagination)
exports.getAdminMatches = async (query) => {
  const {
    sport,
    status,
    search,
    page = 1,
    limit = 10
  } = query;
  const fetchAll = String(limit).toLowerCase() === "all";
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Number(limit) || 10);

  const filter = {};

  if (sport) filter.sport = sport.toLowerCase();
  if (status) filter.status = status.toLowerCase();

  if (search) {
    const searchRegex = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [
      { title: searchRegex },
      { teamA: searchRegex },
      { teamB: searchRegex },
      { tournament: searchRegex },
      { venue: searchRegex },
      { sport: searchRegex },
      { status: searchRegex }
    ];
  }

  const skip = (pageNumber - 1) * limitNumber;
  const matchQuery = Match.find(filter).sort({ createdAt: -1, matchDate: -1 });

  if (!fetchAll) {
    matchQuery.skip(skip).limit(limitNumber);
  }

  const [matches, total] = await Promise.all([
    matchQuery,
    Match.countDocuments(filter)
  ]);

  return {
    matches,
    pagination: {
      total,
      page: fetchAll ? 1 : pageNumber,
      limit: fetchAll ? total : limitNumber,
      pages: fetchAll ? 1 : Math.ceil(total / limitNumber)
    }
  };
};

// Single
exports.getMatchById = async (id) => {
  return await Match.findById(id);
};

// Update
exports.updateMatch = async (id, data) => {
  return await Match.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

// Delete
exports.deleteMatch = async (id) => {
  return await Match.findByIdAndDelete(id);
};

// Toggle Featured
exports.toggleFeatured = async (id) => {
  const match = await Match.findById(id);
  if (!match) return null;

  match.isFeatured = !match.isFeatured;
  await match.save();

  return match;
};

// Go Live
exports.goLive = async (id, payload = {}) => {
  return await Match.findByIdAndUpdate(
    id,
    {
      status: "live",
      // streamUrl: payload.streamUrl || "",
      // streamType: payload.streamType || "other",
      liveStartedAt: new Date()
    },
    { new: true, runValidators: true }
  );
};

// End Live
exports.endLive = async (id) => {
  return await Match.findByIdAndUpdate(
    id,
    {
      status: "completed",
      liveEndedAt: new Date()
    },
    { new: true, runValidators: true }
  );
};

// Public Matches
exports.getPublicMatches = async (query) => {
  const {
    sport,
    status,
    search,
    date,
    page = 1,
    limit = "all"
  } = query;
  const fetchAll = String(limit).toLowerCase() === "all";
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.max(1, Number(limit) || 10);

  const filter = {};

  if (sport) filter.sport = sport.toLowerCase();
  if (status) filter.status = status.toLowerCase();

  if (search) {
    const searchRegex = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [
      { title: searchRegex },
      { teamA: searchRegex },
      { teamB: searchRegex },
      { tournament: searchRegex },
      { venue: searchRegex },
      { sport: searchRegex },
      { status: searchRegex }
    ];
  }

  // Date filter
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    filter.matchDate = {
      $gte: start,
      $lt: end
    };
  }

  const skip = (pageNumber - 1) * limitNumber;
  const matchQuery = Match.find(filter).sort({ matchDate: 1 });

  if (!fetchAll) {
    matchQuery.skip(skip).limit(limitNumber);
  }

  const [matches, total] = await Promise.all([
    matchQuery,
    Match.countDocuments(filter)
  ]);

  return {
    matches,
    total,
    page: fetchAll ? 1 : pageNumber,
    limit: fetchAll ? total : limitNumber
  };
};
// exports.getPublicMatches = async (query) => {
//   const {
//     sport,
//     status,
//     page = 1,
//     limit = 10
//   } = query;

//   const filter = {};

//   if (sport) filter.sport = sport.toLowerCase();
//   if (status) filter.status = status.toLowerCase();

//   const skip = (Number(page) - 1) * Number(limit);

//   const [matches, total] = await Promise.all([
//     Match.find(filter)
//       .sort({ matchDate: 1 })
//       .skip(skip)
//       .limit(Number(limit)),
//     Match.countDocuments(filter)
//   ]);

//   return {
//     matches,
//     total,
//     page: Number(page),
//     limit: Number(limit)
//   };
// };

// Live / Featured / Upcoming
exports.getByStatus = async (status) => {
  return await Match.find({ status }).sort({ matchDate: 1 });
};

exports.getFeatured = async () => {
  return await Match.find({ isFeatured: true }).sort({ matchDate: 1 });
};
