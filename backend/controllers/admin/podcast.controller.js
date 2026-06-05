const Podcast = require("../../models/podcast.model");
const Sport = require("../../models/sport.model");
const uploadToFirebase = require("../../utils/uploadToFirebase");
const deleteFromFirebase = require("../../utils/deleteFromFirebase");


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
      isFeatured,
      isPremium,
      status
    } = req.body;

    let sources = [];
    if (req.body.sources) {
      try {
        sources = JSON.parse(req.body.sources);
      } catch (e) {
        sources = [];
      }
    }

    if (!sportId || !title || (!url && sources.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Sport, Title, and at least one Source or URL are required"
      });
    }

    const sportExists = await Sport.findById(sportId);
    if (!sportExists) {
      return res.status(404).json({ success: false, message: "Sport not found" });
    }

    let thumbnail = "";
    let liveLogo = "";

    if (req.files?.thumbnail?.[0]) {
      thumbnail = await uploadToFirebase(req.files.thumbnail[0], "podcasts");
    }
    if (req.files?.liveLogo?.[0]) {
      liveLogo = await uploadToFirebase(req.files.liveLogo[0], "podcasts");
    }

    const podcast = await Podcast.create({
      sportId,
      title,
      description,
      url,
      type,
      sources,
      duration,
      category,
      isFeatured: isFeatured === "true" || isFeatured === true,
      isPremium: isPremium === "true" || isPremium === true,
      status: status || "active",
      thumbnail,
      liveLogo,
      showLiveLogo: req.body.showLiveLogo === "true" || req.body.showLiveLogo === true,
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

    if (updateData.sources) {
      try {
        updateData.sources = JSON.parse(updateData.sources);
      } catch (e) {
        delete updateData.sources;
      }
    }

    if (updateData.isFeatured !== undefined) updateData.isFeatured = updateData.isFeatured === "true" || updateData.isFeatured === true;
    if (updateData.isPremium !== undefined) updateData.isPremium = updateData.isPremium === "true" || updateData.isPremium === true;
    if (updateData.showLiveLogo !== undefined) updateData.showLiveLogo = updateData.showLiveLogo === "true" || updateData.showLiveLogo === true;

    if (updateData.sportId) {
      const sportExists = await Sport.findById(updateData.sportId);
      if (!sportExists) return res.status(404).json({ success: false, message: "Sport not found" });
    }

    const existing = await Podcast.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Podcast not found" });

    if (req.files?.thumbnail?.[0]) {
      if (existing?.thumbnail) {
        await deleteFromFirebase(existing.thumbnail);
      }
      updateData.thumbnail = await uploadToFirebase(req.files.thumbnail[0], "podcasts");
    }

    if (req.files?.liveLogo?.[0]) {
      if (existing?.liveLogo) {
        await deleteFromFirebase(existing.liveLogo);
      }
      updateData.liveLogo = await uploadToFirebase(req.files.liveLogo[0], "podcasts");
    } else if (req.body.liveLogo !== undefined) {
      updateData.liveLogo = req.body.liveLogo;
    }


    const podcast = await Podcast.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: "after" }
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
    const podcast = await Podcast.findById(req.params.id);

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: "Podcast not found"
      });
    }

    if (podcast.thumbnail) {
      await deleteFromFirebase(podcast.thumbnail);
    }
    if (podcast.liveLogo) {
      await deleteFromFirebase(podcast.liveLogo);
    }

    await Podcast.findByIdAndDelete(req.params.id);


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