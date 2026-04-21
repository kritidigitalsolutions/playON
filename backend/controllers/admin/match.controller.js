const matchService = require("../../services/match.service");
const uploadToFirebase = require("../../utils/uploadToFirebase");
const autoNotify = require("../../utils/autoNotify");

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
  let thumbnail = "";
let banner = "";
let teamALogo = "";
let teamBLogo = "";

if (req.files?.thumbnail?.[0]) {
  thumbnail = await uploadToFirebase(
    req.files.thumbnail[0],
    "matches"
  );
}

if (req.files?.banner?.[0]) {
  banner = await uploadToFirebase(
    req.files.banner[0],
    "matches"
  );
}

if (req.files?.teamALogo?.[0]) {
  teamALogo = await uploadToFirebase(
    req.files.teamALogo[0],
    "matches"
  );
}

if (req.files?.teamBLogo?.[0]) {
  teamBLogo = await uploadToFirebase(
    req.files.teamBLogo[0],
    "matches"
  );
}

const data = {
  ...req.body,
  isFeatured: parseBoolean(req.body.isFeatured),
  thumbnail,
  banner,
  teamALogo,
  teamBLogo,
  createdBy: req.admin._id
};

    const match = await matchService.createMatch(data);
await autoNotify({
  title: "New Match Added",
  message: `${match.teamA} vs ${match.teamB} is now scheduled.`,
  type: "MATCH",
  metadata: {
    matchId: match._id
  }
});
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
  data.thumbnail = await uploadToFirebase(
    req.files.thumbnail[0],
    "matches"
  );
}

if (req.files?.banner?.[0]) {
  data.banner = await uploadToFirebase(
    req.files.banner[0],
    "matches"
  );
}

if (req.files?.teamALogo?.[0]) {
  data.teamALogo = await uploadToFirebase(
    req.files.teamALogo[0],
    "matches"
  );
}

if (req.files?.teamBLogo?.[0]) {
  data.teamBLogo = await uploadToFirebase(
    req.files.teamBLogo[0],
    "matches"
  );
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
    // const match = await matchService.goLive(req.params.id);

    const match = await matchService.goLive(
  req.params.id,
  req.body
);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }
await autoNotify({
  title: "Match Live Now",
  message: `${match.teamA} vs ${match.teamB} is live now.`,
  type: "MATCH",
  metadata: {
    matchId: match._id
  }
});
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
    if (match.status !== "live") {
  return res.status(400).json({
    success: false,
    message: "Match is not live yet"
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
    if (stream.status !== "live") {
  return res.status(400).json({
    success: false,
    message: "Stream is not live yet"
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