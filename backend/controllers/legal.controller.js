const legalService = require("../services/legal.service");

// Public Get Single Page
exports.getPage = async (req, res) => {
  try {
    const page = await legalService.getPageByType(
      req.params.type
    );

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found"
      });
    }

    res.json({
      success: true,
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};