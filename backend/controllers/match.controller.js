const matchService = require("../services/match.service");

// helpers
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

const formatMatch = (req, doc) => {
  const match = doc.toObject ? doc.toObject() : doc;

  return {
    ...match,
    thumbnail: fileUrl(req, match.thumbnail),
    banner: fileUrl(req, match.banner),
    teamALogo: fileUrl(req, match.teamALogo),
    teamBLogo: fileUrl(req, match.teamBLogo)
  };
};

// All Matches
exports.getMatches = async (req, res) => {
  try {
    const result = await matchService.getPublicMatches(req.query);

    res.json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      matches: result.matches.map((item) => formatMatch(req, item))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Live Matches
exports.getLiveMatches = async (req, res) => {
  try {
    const matches = await matchService.getByStatus("live");

    res.json({
      success: true,
      count: matches.length,
      matches: matches.map((item) => formatMatch(req, item))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Upcoming Matches
exports.getUpcomingMatches = async (req, res) => {
  try {
    const matches = await matchService.getByStatus("upcoming");

    res.json({
      success: true,
      count: matches.length,
      matches: matches.map((item) => formatMatch(req, item))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Featured Matches
exports.getFeaturedMatches = async (req, res) => {
  try {
    const matches = await matchService.getFeatured();

    res.json({
      success: true,
      count: matches.length,
      matches: matches.map((item) => formatMatch(req, item))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Single Match
exports.getSingleMatch = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    res.json({
      success: true,
      match: formatMatch(req, match)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};