const matchService = require("../../services/match.service");

// helpers
const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return false;
};

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

// Create
exports.createMatch = async (req, res) => {
  try {
    const data = {
      ...req.body,
      isFeatured: parseBoolean(req.body.isFeatured),
      thumbnail: req.files?.thumbnail?.[0]?.path || "",
      banner: req.files?.banner?.[0]?.path || "",
      teamALogo: req.files?.teamALogo?.[0]?.path || "",
      teamBLogo: req.files?.teamBLogo?.[0]?.path || "",
      createdBy: req.admin._id
    };

    const match = await matchService.createMatch(data);

    res.status(201).json({
      success: true,
      message: "Match created successfully",
      match: formatMatch(req, match)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin List
exports.getAllMatches = async (req, res) => {
  try {
    const result = await matchService.getAdminMatches(req.query);

    res.json({
      success: true,
      ...result,
      matches: result.matches.map((item) => formatMatch(req, item))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Single
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

// Update
exports.updateMatch = async (req, res) => {
  try {
    const data = {
      ...req.body
    };

    if (req.body.isFeatured !== undefined) {
      data.isFeatured = parseBoolean(req.body.isFeatured);
    }

    if (req.files?.thumbnail?.[0]) {
      data.thumbnail = req.files.thumbnail[0].path;
    }

    if (req.files?.banner?.[0]) {
      data.banner = req.files.banner[0].path;
    }

    if (req.files?.teamALogo?.[0]) {
      data.teamALogo = req.files.teamALogo[0].path;
    }

    if (req.files?.teamBLogo?.[0]) {
      data.teamBLogo = req.files.teamBLogo[0].path;
    }

    const match = await matchService.updateMatch(req.params.id, data);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    res.json({
      success: true,
      message: "Match updated successfully",
      match: formatMatch(req, match)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete
exports.deleteMatch = async (req, res) => {
  try {
    const match = await matchService.deleteMatch(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    res.json({
      success: true,
      message: "Match deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle Featured
exports.toggleFeatured = async (req, res) => {
  try {
    const match = await matchService.toggleFeatured(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    res.json({
      success: true,
      message: "Featured updated",
      match: formatMatch(req, match)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Go Live
exports.goLive = async (req, res) => {
  try {
    const match = await matchService.goLive(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    res.json({
      success: true,
      message: "Match is now live",
      match: formatMatch(req, match)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// End Live
exports.endLive = async (req, res) => {
  try {
    const match = await matchService.endLive(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    res.json({
      success: true,
      message: "Match ended",
      match: formatMatch(req, match)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.watchMatch = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    const Stream = require("../../models/stream.model");
    const stream = await Stream.findOne({ matchId: req.params.id }).sort({ createdAt: -1 });

    if (!stream || !stream.streamUrl) {
      return res.status(404).json({
        success: false,
        message: "No stream URL found for this match"
      });
    }

    res.json({
      success: true,
      preview: true,
      stream: {
        streamUrl: stream.streamUrl,
        streamType: stream.streamType
      },
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};