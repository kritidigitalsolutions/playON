const Highlight = require("../../models/starPlayer.model");
const uploadToFirebase = require("../../utils/uploadToFirebase");
const deleteFromFirebase = require("../../utils/deleteFromFirebase");

const autoNotify = require("../../utils/autoNotify");
const Sport = require("../../models/sport.model");
const Player = require("../../models/player.model");

const fileUrl = (req, filePath) => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/${filePath.replace(/\\/g, "/")}`;
};

const formatHighlight = (req, doc) => {
  const highlight = doc.toObject ? doc.toObject() : doc;
  return {
    ...highlight,
    thumbnail: fileUrl(req, highlight.thumbnail),
    liveLogo: fileUrl(req, highlight.liveLogo)
  };
};

// ----------------------------------------
// CREATE HIGHLIGHT (SPORT BASED)
// ----------------------------------------
const createPlayerService = require("../../services/player.service");

exports.createHighlight = async (req, res) => {
  try {
    const {
      sportId,
      playerId,
      playerName,
      team,
      title,
      videoUrl,
      type,
      duration,
      isFeatured,
      isPremium
    } = req.body;

    let sources = [];
    if (req.body.sources) {
      try {
        sources = JSON.parse(req.body.sources);
      } catch (e) {
        sources = [];
      }
    }

    // BASIC VALIDATION
    if (!sportId || !title || (!videoUrl && sources.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing (Sport, Title, and at least one Source or URL)"
      });
    }

    // SPORT CHECK
    const sportExists = await Sport.findById(sportId);
    if (!sportExists) {
      return res.status(404).json({
        success: false,
        message: "Sport not found"
      });
    }

    let finalPlayerId = playerId;
    let finalPlayerName = playerName;

    // -----------------------------
    // CASE 1: EXISTING PLAYER
    // -----------------------------
    if (playerId) {
      const playerExists = await Player.findById(playerId);

      if (!playerExists) {
        return res.status(404).json({
          success: false,
          message: "Player not found"
        });
      }

      finalPlayerName = playerExists.name;
    }

    // -----------------------------
    // CASE 2: CREATE NEW PLAYER
    // -----------------------------
    else {
      if (!playerName) {
        return res.status(400).json({
          success: false,
          message: "Player name required for new player"
        });
      }

      const newPlayer = await createPlayerService.createPlayer({
        name: playerName,
        sport: sportExists.name, // or sportId mapping
        team: team || ""
      });

      finalPlayerId = newPlayer._id;
      finalPlayerName = newPlayer.name;
    }

    // THUMBNAIL & LIVE LOGO
    let thumbnailUrl = "";
    let liveLogoUrl = "";
    if (req.files?.thumbnail?.[0]) {
      thumbnailUrl = await uploadToFirebase(req.files.thumbnail[0], "highlights");
    }
    if (req.files?.liveLogo?.[0]) {
      liveLogoUrl = await uploadToFirebase(req.files.liveLogo[0], "highlights");
    }

    // CREATE HIGHLIGHT
    const highlight = await Highlight.create({
      sportId,
      playerId: finalPlayerId,
      playerName: finalPlayerName,
      team,
      title,
      videoUrl,
      type: type || "other",
      sources,
      duration,
      isFeatured: isFeatured === "true" || isFeatured === true,
      isPremium: isPremium === "true" || isPremium === true,
      thumbnail: thumbnailUrl,
      liveLogo: liveLogoUrl,
      showLiveLogo: req.body.showLiveLogo === "true" || req.body.showLiveLogo === true,
      createdBy: req.admin?._id || req.admin?.adminId
    });

    await autoNotify({
      title: "New Highlight 🔥",
      message: `${finalPlayerName} highlight added`,
      type: "HIGHLIGHT",
      metadata: {
        image: thumbnailUrl,
        sportId
      }
    });

    res.status(201).json({
      success: true,
      message: "Highlight created successfully",
      highlight: formatHighlight(req, highlight)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------------------------
// GET ALL HIGHLIGHTS (ADMIN)
// ----------------------------------------
exports.getHighlights = async (req, res) => {
  try {
    const { sportId, search, isPremium } = req.query;

    const filter = {};

    if (sportId) {
      filter.sportId = sportId;
    }

    // Filter by premium status if provided
    if (isPremium !== undefined && isPremium !== "") {
      filter.isPremium = isPremium === "true";
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { playerName: regex },
        { title: regex },
        { team: regex }
      ];
    }

    const highlights = await Highlight.find(filter)
      .populate("sportId", "name slug")
      .populate("playerId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: highlights.length,
      highlights: highlights.map((item) => formatHighlight(req, item))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------------------------
// GET SINGLE HIGHLIGHT
// ----------------------------------------
exports.getSingleHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id)
      .populate("sportId", "name slug")
      .populate("playerId", "name");

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found"
      });
    }

    res.json({
      success: true,
      highlight: formatHighlight(req, highlight)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------------------------
// WATCH HIGHLIGHT (ADMIN)
// ----------------------------------------
exports.watchHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id)
      .populate("sportId", "name slug")
      .populate("playerId", "name");

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found"
      });
    }

    res.json({
      success: true,
      highlight: formatHighlight(req, highlight)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------------------------
// UPDATE HIGHLIGHT
// ----------------------------------------
exports.updateHighlight = async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.sources) {
      try {
        data.sources = JSON.parse(data.sources);
      } catch (e) {
        delete data.sources;
      }
    }

    if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === "true" || data.isFeatured === true;
    if (data.isPremium !== undefined) data.isPremium = data.isPremium === "true" || data.isPremium === true;
    if (data.showLiveLogo !== undefined) data.showLiveLogo = data.showLiveLogo === "true" || data.showLiveLogo === true;

    const existing = await Highlight.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Highlight not found" });

    // Thumbnail update
    if (req.files?.thumbnail?.[0]) {
      if (existing?.thumbnail) {
        await deleteFromFirebase(existing.thumbnail);
      }
      data.thumbnail = await uploadToFirebase(req.files.thumbnail[0], "highlights");
    }

    // Live Logo update
    if (req.files?.liveLogo?.[0]) {
      if (existing?.liveLogo) {
        await deleteFromFirebase(existing.liveLogo);
      }
      data.liveLogo = await uploadToFirebase(req.files.liveLogo[0], "highlights");
    } else if (req.body.liveLogo !== undefined) {
      data.liveLogo = req.body.liveLogo;
    }


    // Type validation
    if (data.type && !["youtube", "mp4", "iframe", "other"].includes(data.type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type"
      });
    }

    // Optional sport validation
    if (data.sportId) {
      const sportExists = await Sport.findById(data.sportId);
      if (!sportExists) {
        return res.status(404).json({
          success: false,
          message: "Sport not found"
        });
      }
    }

    const highlight = await Highlight.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found"
      });
    }

    res.json({
      success: true,
      message: "Highlight updated successfully",
      highlight: formatHighlight(req, highlight)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------------------------
// DELETE HIGHLIGHT
// ----------------------------------------
exports.deleteHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found"
      });
    }

    if (highlight.thumbnail) {
      await deleteFromFirebase(highlight.thumbnail);
    }
    if (highlight.liveLogo) {
      await deleteFromFirebase(highlight.liveLogo);
    }

    await Highlight.findByIdAndDelete(req.params.id);


    res.json({
      success: true,
      message: "Highlight deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};