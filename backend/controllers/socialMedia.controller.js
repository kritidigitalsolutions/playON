const SocialMedia = require('../models/socialMedia.model');

// GET ALL (for public display)
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
  };
};

