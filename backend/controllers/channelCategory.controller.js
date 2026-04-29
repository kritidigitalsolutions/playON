const ChannelCategory = require("../models/channelCategory.model");

exports.getCategories = async (req, res) => {
  try {
    const categories = await ChannelCategory.find({
      isActive: true
    }).sort({ name: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};