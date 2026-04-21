const playerService = require("../../services/player.service");
const uploadToFirebase = require("../../utils/uploadToFirebase");

const makeSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

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

// Create
exports.createPlayer = async (req, res) => {
  try {
    let image = "";

    if (req.file) {
      image = await uploadToFirebase(req.file, "players");
    }

    const data = {
      ...req.body,
      slug: makeSlug(req.body.name),
      image
    };

    const player = await playerService.createPlayer(data);

    res.status(201).json({
      success: true,
      message: "Player created successfully",
      player: formatPlayer(req, player)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// List
exports.getPlayers = async (req, res) => {
  try {
    const result = await playerService.getPlayers(req.query);

    res.json({
      success: true,
      ...result,
      players: result.players.map((item) =>
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

// Single
exports.getSinglePlayer = async (req, res) => {
  try {
    const player = await playerService.getPlayerById(
      req.params.id
    );

    if (!player) {
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

// Update
exports.updatePlayer = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.body.name) {
      data.slug = makeSlug(req.body.name);
    }

    if (req.file) {
      data.image = await uploadToFirebase(
        req.file,
        "players"
      );
    }

    const player = await playerService.updatePlayer(
      req.params.id,
      data
    );

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      });
    }

    res.json({
      success: true,
      message: "Player updated successfully",
      player: formatPlayer(req, player)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete
exports.deletePlayer = async (req, res) => {
  try {
    const player = await playerService.deletePlayer(
      req.params.id
    );

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      });
    }

    res.json({
      success: true,
      message: "Player deleted successfully"
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
    const player = await playerService.toggleFeatured(
      req.params.id
    );

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      });
    }

    res.json({
      success: true,
      message: "Featured updated",
      player: formatPlayer(req, player)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};