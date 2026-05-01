const Podcast = require("../../models/podcast.model");
const Sport = require("../../models/sport.model");

// CREATE PODCAST
exports.createPodcast = async (req, res) => {
  try {
    const {
      sportId,
      title,
      description,
      url,
      type,
      duration,
      category,
      isFeatured
    } = req.body;

    if (!sportId || !title || !url) {
      return res.status(400).json({
        success: false,
        message: "Sport, Title, and URL are required"
      });
    }

    const sportExists = await Sport.findById(sportId);
    if (!sportExists) {
      return res.status(404).json({ success: false, message: "Sport not found" });
    }

    let thumbnail = "";

    if (req.file) {
      const uploadToFirebase = require("../../utils/uploadToFirebase");
      thumbnail = await uploadToFirebase(req.file, "podcasts");
    }

    const podcast = await Podcast.create({
      sportId,
      title,
      description,
      url,
      type,
      duration,
      category,
      isFeatured,
      thumbnail,
      createdBy: req.admin?._id || null
    });

    res.json({
      success: true,
      message: "Podcast created successfully",
      podcast
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL PODCASTS
exports.getAllPodcasts = async (req, res) => {
  try {
    const podcasts = await Podcast.find().populate("sportId", "name slug").sort({ createdAt: -1 });

    res.json({
      success: true,
      count: podcasts.length,
      podcasts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE PODCAST
exports.getSinglePodcast = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id).populate("sportId", "name slug");

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: "Podcast not found"
      });
    }

    res.json({
      success: true,
      podcast
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE PODCAST
exports.updatePodcast = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.sportId) {
      const sportExists = await Sport.findById(updateData.sportId);
      if (!sportExists) return res.status(404).json({ success: false, message: "Sport not found" });
    }

    if (req.file) {
      const uploadToFirebase = require("../../utils/uploadToFirebase");
      updateData.thumbnail = await uploadToFirebase(req.file, "podcasts");
    }

    const podcast = await Podcast.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: "Podcast not found"
      });
    }

    res.json({
      success: true,
      message: "Podcast updated successfully",
      podcast
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE PODCAST
exports.deletePodcast = async (req, res) => {
  try {
    const podcast = await Podcast.findByIdAndDelete(req.params.id);

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: "Podcast not found"
      });
    }

    res.json({
      success: true,
      message: "Podcast deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// TOGGLE FEATURED
exports.toggleFeatured = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: "Podcast not found"
      });
    }

    podcast.isFeatured = !podcast.isFeatured;
    await podcast.save();

    res.json({
      success: true,
      message: "Featured status updated",
      isFeatured: podcast.isFeatured
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};