const Podcast = require("../models/podcast.model");
const subscriptionService = require("../services/subscription.service");
const jwt = require("jsonwebtoken");

const getUserIdFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    return decoded?.userId || null;
  } catch { return null; }
};

// helper for thumbnail URL (same pattern as your match controller if needed)
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

const formatPodcast = (req, doc) => {
  const podcast = doc.toObject ? doc.toObject() : doc;

  return {
    ...podcast,
    isPremium: !!podcast.isPremium,
    thumbnail: fileUrl(req, podcast.thumbnail),
    liveLogo: fileUrl(req, podcast.liveLogo)
  };
};

// GET ALL (with optional filters)
exports.getPodcasts = async (req, res) => {
  try {
    const { type, featured, sportId } = req.query;

    const filter = { status: "active" };

    if (sportId) {
      filter.sportId = sportId;
    }

    if (type) {
      filter.type = type;
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    const podcasts = await Podcast.find(filter).populate("sportId", "name slug").sort({ createdAt: -1 });

    res.json({
      success: true,
      count: podcasts.length,
      podcasts: podcasts.map((item) => formatPodcast(req, item))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET FEATURED (shortcut API)
exports.getFeaturedPodcasts = async (req, res) => {
  try {
    const podcasts = await Podcast.find({
      status: "active",
      isFeatured: true
    }).populate("sportId", "name slug").sort({ createdAt: -1 });

    res.json({
      success: true,
      count: podcasts.length,
      podcasts: podcasts.map((item) => formatPodcast(req, item))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE PODCAST
exports.getSinglePodcast = async (req, res) => {
  try {
    const podcast = await Podcast.findOne({
      _id: req.params.id,
      status: "active"
    }).populate("sportId", "name slug");

    if (!podcast) {
      return res.status(404).json({ success: false, message: "Podcast not found" });
    }

    // ✅ PREMIUM GATE
    if (podcast.isPremium) {
      const userId = getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: "Login required to listen to premium content", locked: true, isPremium: true });
      }
      const hasAccess = await subscriptionService.checkAccess(userId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Active subscription required to listen to this podcast", locked: true, isPremium: true });
      }
    }

    res.json({
      success: true,
      podcast: formatPodcast(req, podcast)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};