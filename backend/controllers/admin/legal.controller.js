const legalService = require("../../services/legal.service");

// Create / Update
exports.upsertPage = async (req, res) => {
  try {
    const page = await legalService.upsertPage(
      req.params.type,
      req.body,
      req.admin._id
    );

    res.json({
      success: true,
      message: "Page saved successfully",
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get All
exports.getPages = async (req, res) => {
  try {
    const pages = await legalService.getPages();

    res.json({
      success: true,
      count: pages.length,
      pages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Single
exports.getSinglePage = async (req, res) => {
  try {
    const page = await legalService.getAdminPageByType(
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

// Toggle Status
exports.toggleStatus = async (req, res) => {
  try {
    const page = await legalService.toggleStatus(
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
      message: "Status updated successfully",
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete
exports.deletePage = async (req, res) => {
  try {
    const page = await legalService.deletePage(
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
      message: "Page deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};