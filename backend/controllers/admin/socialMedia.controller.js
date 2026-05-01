const SocialMedia = require("../../models/socialMedia.model");

// CREATE (initial setup or add one platform)
exports.createSocialMedia = async (req, res) => {
  try {
    const { platform, url } = req.body;

    const exists = await SocialMedia.findOne({ platform });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: `${platform} already exists`
      });
    }

    const data = await SocialMedia.create({ platform, url });

    res.status(201).json({
      success: true,
      message: "Social media created",
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL
exports.getAllSocialMedia = async (req, res) => {
  try {
    const data = await SocialMedia.find().sort({ createdAt: 1 });

    res.json({
      success: true,
      count: data.length,
      social: data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE SINGLE (by platform)
exports.updateSocialMedia = async (req, res) => {
  try {
    const { platform } = req.params;
    const { url } = req.body;

    const data = await SocialMedia.findOneAndUpdate(
      { platform },
      { url },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Platform not found"
      });
    }

    res.json({
      success: true,
      message: "Updated successfully",
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE SINGLE
exports.deleteSocialMedia = async (req, res) => {
  try {
    const { platform } = req.params;

    const data = await SocialMedia.findOneAndDelete({ platform });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Platform not found"
      });
    }

    res.json({
      success: true,
      message: "Deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};