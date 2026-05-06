const Highlight = require("../models/highlight.model");

const resolveUrl = (req, url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
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

// GET /api/highlights?matchId=xxx   (matchId optional — omit to get all)
exports.getHighlightsByMatch = async (req, res) => {
  try {
    const { matchId } = req.query;
    const filter = matchId ? { matchId } : {};

    const highlights = await Highlight.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select("-createdBy");

    res.json({
      success: true,
      count: highlights.length,
      highlights: highlights.map(h => formatHighlight(req, h))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
