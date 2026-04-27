const sportService = require("../services/sport.service");

// Add Sport
exports.createSport = async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Sport name is required"
      });
    }

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-");

    const data = await sportService.createSport({
      name,
      slug
    });

    res.status(201).json({
      success: true,
      sport: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin Get Sports
exports.getSports = async (req, res) => {
  try {
    const data = await sportService.getSports();

    res.status(200).json({
      success: true,
      sports: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Sport
exports.deleteSport = async (req, res) => {
  try {
    const data = await sportService.deleteSport(
      req.params.id
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Sport not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Sport deleted"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Public Sports
exports.getPublicSports = async (req, res) => {
  try {
    const data =
      await sportService.getActiveSports();

    res.status(200).json({
      success: true,
      sports: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Sport
exports.updateSport = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const updateData = { isActive: req.body.isActive };

    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/\s+/g, "-");
    }

    const data = await sportService.updateSport(req.params.id, updateData);

    if (!data) {
      return res.status(404).json({ success: false, message: "Sport not found" });
    }

    res.status(200).json({ success: true, sport: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Status
exports.toggleStatus = async (req, res) => {
  try {
    const data = await sportService.toggleSportStatus(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Sport not found" });
    }
    res.status(200).json({ success: true, sport: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
