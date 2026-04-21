const Watchlist = require("../models/watchlist.model");

exports.toggleWatchlist = async (req, res) => {
  try {
    const { itemId, itemType } = req.body;

    const userId = req.user.userId;

    const exists = await Watchlist.findOne({
      userId,
      itemId,
      itemType
    });

    if (exists) {
      await Watchlist.deleteOne({ _id: exists._id });

      return res.json({
        success: true,
        saved: false,
        message: "Removed from watchlist"
      });
    }

    await Watchlist.create({
      userId,
      itemId,
      itemType
    });

    res.json({
      success: true,
      saved: true,
      message: "Added to watchlist"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const userId = req.user.userId;

    const items = await Watchlist.find({ userId }).sort({
      createdAt: -1
    });

    res.json({
      success: true,
      count: items.length,
      items
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.removeWatchlist = async (req, res) => {
  try {
    const item = await Watchlist.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    res.json({
      success: true,
      message: "Removed successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.checkWatchlist = async (req, res) => {
  try {
    const { itemId, itemType } = req.params;

    const exists = await Watchlist.findOne({
      userId: req.user.userId,
      itemId,
      itemType
    });

    res.json({
      success: true,
      saved: !!exists
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};