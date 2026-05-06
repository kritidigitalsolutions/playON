const Highlight = require("../models/highlight.model");

const resolveUrl = (req, url) => {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${req.protocol}://${req.get("host")}/${url.replace(/\\/g, "/")}`;
};

const formatHighlight = (req, doc) => {
  const h = doc.toObject ? doc.toObject() : doc;

  return {
    ...h,
    videoUrl: resolveUrl(req, h.videoUrl),
    thumbnail: resolveUrl(req, h.thumbnail)
  };
};

// GET /api/highlights
// GET /api/highlights?matchId=xxx
// GET /api/highlights?category=goal
exports.getHighlightsByMatch = async (req, res) => {
  try {
    const {
      matchId,
      category,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // Match filter
    if (matchId) {
      filter.matchId = matchId;
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    const skip =
      (Number(page) - 1) * Number(limit);

    const [highlights, total] = await Promise.all([
      Highlight.find(filter)
        .populate(
          "matchId",
          "title teamA teamB sport tournament status"
        )
        .sort({
          order: 1,
          createdAt: -1
        })
        .skip(skip)
        .limit(Number(limit))
        .select("-createdBy"),

      Highlight.countDocuments(filter)
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      count: highlights.length,
      highlights: highlights.map((h) =>
        formatHighlight(req, h)
      )
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// GET /api/highlights/:id
exports.getSingleHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(
      req.params.id
    )
      .populate(
        "matchId",
        "title teamA teamB sport tournament status"
      )
      .select("-createdBy");

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