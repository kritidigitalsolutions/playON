const Highlight = require("../models/starPlayer.model");
const subscriptionService = require("../services/subscription.service");
const jwt = require("jsonwebtoken");

// ----------------------------------------
// HELPER — resolve userId from optional Bearer token
// ----------------------------------------
const getUserIdFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    return decoded?.userId || null;
  } catch {
    return null;
  }
};

// ----------------------------------------
// GET ALL STAR PLAYERS (USER)
// Returns all highlights; premium items carry isPremium=true so the
// frontend can render a lock badge without blocking the list.
// ----------------------------------------
exports.getStarPlayers = async (req, res) => {
  try {
    const { sportId, search } = req.query;

    const filter = {};

    // ✅ FILTER BY SPORT
    if (sportId) {
      filter.sportId = sportId;
    }

    // ✅ SEARCH
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { playerName: regex },
        { title: regex },
        { team: regex }
      ];
    }

    const highlights = await Highlight.find(filter)
      .sort({ createdAt: -1 })
      .populate("sportId", "name slug")
      .populate("playerId", "name team country image");

    res.json({
      success: true,
      count: highlights.length,
      highlights: highlights.map((h) => ({ ...h.toObject(), isPremium: !!h.isPremium }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------------------------
// GET FEATURED STAR PLAYERS (USER)
// ----------------------------------------
exports.getFeaturedStarPlayers = async (req, res) => {
  try {
    const highlights = await Highlight.find({ isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("sportId", "name slug")
      .populate("playerId", "name team country image");

    res.json({
      success: true,
      highlights: highlights.map((h) => ({ ...h.toObject(), isPremium: !!h.isPremium }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------------------------
// GET SINGLE STAR PLAYER (USER)
// • Free content  → any logged-in user can access
// • Premium content → active subscription required
// ----------------------------------------
exports.getSingleStarPlayer = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id)
      .populate("sportId", "name slug")
      .populate("playerId", "name team country image");

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found"
      });
    }

    // ✅ PREMIUM GATE — check subscription if content is paid
    if (highlight.isPremium) {
      const userId = getUserIdFromToken(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Login required to watch premium content",
          locked: true,
          isPremium: true
        });
      }

      const hasAccess = await subscriptionService.checkAccess(userId);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Active subscription required to watch this content",
          locked: true,
          isPremium: true
        });
      }
    }

    res.json({
      success: true,
      highlight: { ...highlight.toObject(), isPremium: !!highlight.isPremium }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};