const Sport = require("../models/sport.model");
const Match = require("../models/match.model");

// Add Sport
exports.createSport = async (data) => {
  return await Sport.create(data);
};

// Get All Sports with Match Count
exports.getSports = async () => {
  const sports = await Sport.find().sort({ name: 1 });

  const result = await Promise.all(
    sports.map(async (sport) => {
      const count = await Match.countDocuments({
        sport: sport.slug
      });

      return {
        ...sport.toObject(),
        matchCount: count,
        hasMatches: count > 0
      };
    })
  );

  return result;
};

// Delete Sport
exports.deleteSport = async (id) => {
  const sport = await Sport.findById(id);
  if (!sport) return null;

  const count = await Match.countDocuments({
    sport: sport.slug
  });

  if (count > 0) {
    throw new Error("Sport contains matches");
  }

  await sport.deleteOne();

  return sport;
};

// Public Active Sports
exports.getActiveSports = async () => {
  return await Sport.find({
    isActive: true
  }).sort({ name: 1 });
};
// Update Sport
exports.updateSport = async (id, data) => {
  return await Sport.findByIdAndUpdate(id, data, { new: true });
};

// Toggle Sport Status
exports.toggleSportStatus = async (id) => {
  const sport = await Sport.findById(id);
  if (!sport) return null;
  sport.isActive = !sport.isActive;
  await sport.save();
  return sport;
};
