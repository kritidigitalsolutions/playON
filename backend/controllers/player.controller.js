const playerService = require("../services/player.service");
const User = require("../models/user.model");

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

const formatPlayer = (req, doc) => {
  const player = doc.toObject ? doc.toObject() : doc;

  return {
    ...player,
    image: fileUrl(req, player.image)
  };
};

// GET /api/players
exports.getPlayers = async (req, res) => {
  try {
    const players = await playerService.getPublicPlayers(
      req.query
    );

    res.json({
      success: true,
      count: players.length,
      players: players.map((item) =>
        formatPlayer(req, item)
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/players/featured
exports.getFeaturedPlayers = async (req, res) => {
  try {
    const players =
      await playerService.getFeaturedPlayers();

    res.json({
      success: true,
      count: players.length,
      players: players.map((item) =>
        formatPlayer(req, item)
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/players/:slug
exports.getPlayerBySlug = async (req, res) => {
  try {
    const player = await playerService.getPlayerBySlug(
      req.params.slug
    );

    if (!player || player.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      });
    }

    res.json({
      success: true,
      player: formatPlayer(req, player)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// POST /api/players/:id/toggle-follow
exports.toggleFollowPlayer = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const playerId = req.params.id;

    const alreadyFollowed = user.followedPlayers.some(
      (item) => item.toString() === playerId
    );

    if (alreadyFollowed) {
      user.followedPlayers.pull(playerId);
    } else {
      user.followedPlayers.push(playerId);
    }

    await user.save();

    res.json({
      success: true,
      message: alreadyFollowed
        ? "Player unfollowed"
        : "Player followed",
      followed: !alreadyFollowed,
      followedPlayers: user.followedPlayers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/players/following/me
exports.getMyFollowedPlayers = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      "followedPlayers",
      "name slug sport team image featured"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      count: user.followedPlayers.length,
      players: user.followedPlayers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};