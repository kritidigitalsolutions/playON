const Highlight = require("../../models/highlight.model");
const Match = require("../../models/match.model");
const uploadToFirebase = require("../../utils/uploadToFirebase");

const parseBoolean = (v) => {
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return false;
};

// Helper: resolve full URL (Firebase URLs are already absolute)
const resolveUrl = (req, url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${req.protocol}://${req.get("host")}/${url.replace(/\\/g, "/")}`;
};

const formatHighlight = (req, doc) => {
  const h = doc.toObject ? doc.toObject() : doc;
  return {
    ...h,
    videoUrl: resolveUrl(req, h.videoUrl),
    thumbnail: resolveUrl(req, h.thumbnail)
  };
};

// POST /api/admin/highlights
exports.createHighlight = async (req, res) => {
  try {
    const { matchId, title, description, category, sourceType, videoUrl, duration, tags, isPremium, order } = req.body;

    if (!matchId || !title) {
      return res.status(400).json({ success: false, message: "matchId and title are required" });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    let finalVideoUrl = videoUrl || "";
    let finalThumbnail = "";

    // Handle uploaded video file
    if (sourceType === "upload") {
      if (!req.files?.videoFile?.[0]) {
        return res.status(400).json({ success: false, message: "Video file is required when sourceType is upload" });
      }
      finalVideoUrl = await uploadToFirebase(req.files.videoFile[0], "highlights/videos");
    } else {
      // URL mode
      if (!finalVideoUrl?.trim()) {
        return res.status(400).json({ success: false, message: "videoUrl is required when sourceType is url" });
      }
    }

    // Optional thumbnail image
    if (req.files?.thumbnail?.[0]) {
      finalThumbnail = await uploadToFirebase(req.files.thumbnail[0], "highlights/thumbnails");
    }

    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = String(tags).split(",").map(t => t.trim()).filter(Boolean);
      }
    }

    const highlight = await Highlight.create({
      matchId,
      title: title.trim(),
      description: description?.trim() || "",
      category: category || "other",
      sourceType: sourceType || "url",
      videoUrl: finalVideoUrl,
      thumbnail: finalThumbnail,
      duration: duration?.trim() || "",
      tags: parsedTags,
      isPremium: parseBoolean(isPremium),
      order: Number(order) || 0,
      createdBy: req.admin._id
    });

    res.status(201).json({ success: true, message: "Highlight created", highlight: formatHighlight(req, highlight) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/highlights?matchId=xxx
exports.getHighlights = async (req, res) => {
  try {
    const { matchId } = req.query;
    const filter = matchId ? { matchId } : {};

    const highlights = await Highlight.find(filter)
      .populate("matchId", "title teamA teamB sport status")
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: highlights.length,
      highlights: highlights.map(h => formatHighlight(req, h))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/highlights/:id
exports.getSingleHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id).populate("matchId", "title teamA teamB sport status");
    if (!highlight) return res.status(404).json({ success: false, message: "Highlight not found" });
    res.json({ success: true, highlight: formatHighlight(req, highlight) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/highlights/:id
exports.updateHighlight = async (req, res) => {
  try {
    const existing = await Highlight.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Highlight not found" });

    const { title, description, category, sourceType, videoUrl, duration, tags, isPremium, order } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    if (duration !== undefined) updateData.duration = duration.trim();
    if (isPremium !== undefined) updateData.isPremium = parseBoolean(isPremium);
    if (order !== undefined) updateData.order = Number(order) || 0;

    // Handle sourceType change or update
    const effectiveSourceType = sourceType || existing.sourceType;
    updateData.sourceType = effectiveSourceType;

    if (effectiveSourceType === "upload" && req.files?.videoFile?.[0]) {
      updateData.videoUrl = await uploadToFirebase(req.files.videoFile[0], "highlights/videos");
    } else if (effectiveSourceType === "url" && videoUrl !== undefined) {
      updateData.videoUrl = videoUrl.trim();
    }

    if (req.files?.thumbnail?.[0]) {
      updateData.thumbnail = await uploadToFirebase(req.files.thumbnail[0], "highlights/thumbnails");
    }

    if (tags !== undefined) {
      try {
        updateData.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch {
        updateData.tags = String(tags).split(",").map(t => t.trim()).filter(Boolean);
      }
    }

    const highlight = await Highlight.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, message: "Highlight updated", highlight: formatHighlight(req, highlight) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/highlights/:id
exports.deleteHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findByIdAndDelete(req.params.id);
    if (!highlight) return res.status(404).json({ success: false, message: "Highlight not found" });
    res.json({ success: true, message: "Highlight deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
