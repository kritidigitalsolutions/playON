const Highlight = require("../../models/highlight.model");
const Match = require("../../models/match.model");
const Series = require("../../models/series.model");
const Team = require("../../models/team.model");

const uploadToFirebase = require("../../utils/uploadToFirebase");
const deleteFromFirebase = require("../../utils/deleteFromFirebase");

// Parse boolean helper
const parseBoolean = (v) => {
  if (v === true || v === "true") {
    return true;
  }

  if (v === false || v === "false") {
    return false;
  }

  return false;
};

// Validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Sanitize ObjectId helper
const sanitizeId = (id) => {
  if (!id) return null;
  const s = String(id).trim();
  if (s === "" || s === "null" || s === "undefined" || s === "none") return null;
  return s;
};

// Parse tags helper
const parseTags = (tags) => {
  if (!tags) return [];

  try {
    return typeof tags === "string"
      ? JSON.parse(tags)
      : tags;
  } catch {
    return String(tags)
      .split(",")
      .map((t) =>
        t.trim().toLowerCase()
      )
      .filter(Boolean);
  }
};

// Resolve URL helper
const resolveUrl = (req, url) => {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${req.protocol}://${req.get(
    "host"
  )}/${url.replace(/\\/g, "/")}`;
};

// Format response
const formatHighlight = (req, doc) => {
  const h = doc.toObject
    ? doc.toObject()
    : doc;

  return {
    ...h,

    videoUrl: resolveUrl(
      req,
      h.videoUrl
    ),

    thumbnail: resolveUrl(
      req,
      h.thumbnail
    )
  };
};

// CREATE HIGHLIGHT
// POST /api/admin/highlights
exports.createHighlight =
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        sourceType,
        videoUrl,
        duration,
        tags,
        isPremium,
        isFeatured,
        order
      } = req.body;

      // Sanitize ObjectId fields — FormData sends empty strings/null strings which are truthy
      const matchId = sanitizeId(req.body.matchId);
      const seriesId = sanitizeId(req.body.seriesId);
      const teamA = sanitizeId(req.body.teamA);
      const teamB = sanitizeId(req.body.teamB);

      // Validation
      if (
        (!matchId &&
          !seriesId) ||
        !title
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Either matchId or seriesId and title are required"
        });
      }

      // Match validation
      if (matchId) {
        const match =
          await Match.findById(
            matchId
          );

        if (!match) {
          return res.status(404).json({
            success: false,

            message:
              "Match not found"
          });
        }
      }

      // Series validation
      if (seriesId) {
        const series =
          await Series.findById(
            seriesId
          );

        if (!series) {
          return res.status(404).json({
            success: false,

            message:
              "Series not found"
          });
        }
      }

      // Team A validation
      if (teamA) {
        const teamADoc = await Team.findById(teamA);
        if (!teamADoc) {
          return res.status(404).json({
            success: false,
            message: "Team A not found"
          });
        }
      }

      // Team B validation
      if (teamB) {
        const teamBDoc = await Team.findById(teamB);
        if (!teamBDoc) {
          return res.status(404).json({
            success: false,
            message: "Team B not found"
          });
        }
      }

      const finalSourceType =
        sourceType || "url";

      let finalVideoUrl = "";
      let finalThumbnail = "";

      const uploadPromises = [];
      const uploadKeys = [];

      // VIDEO UPLOAD MODE
      if (finalSourceType === "upload") {
        if (!req.files?.videoFile?.[0]) {
          return res.status(400).json({
            success: false,
            message: "Video file is required"
          });
        }
        uploadPromises.push(uploadToFirebase(req.files.videoFile[0], "highlights/videos"));
        uploadKeys.push("video");
      } else {
        if (!videoUrl?.trim()) {
          return res.status(400).json({
            success: false,
            message: "videoUrl is required"
          });
        }

        if (!isValidUrl(videoUrl)) {
          return res.status(400).json({
            success: false,
            message: "Invalid video URL"
          });
        }

        finalVideoUrl = videoUrl.trim();
      }

      // OPTIONAL THUMBNAIL
      if (req.files?.thumbnail?.[0]) {
        uploadPromises.push(uploadToFirebase(req.files.thumbnail[0], "highlights/thumbnails"));
        uploadKeys.push("thumbnail");
      }

      const uploadedUrls = await Promise.all(uploadPromises);

      uploadKeys.forEach((key, index) => {
        if (key === "video") finalVideoUrl = uploadedUrls[index];
        if (key === "thumbnail") finalThumbnail = uploadedUrls[index];
      });

      const highlight =
        await Highlight.create({
          matchId:
            matchId || null,

          seriesId:
            seriesId || null,

          teamA:
            teamA || null,

          teamB:
            teamB || null,

          title: title.trim(),

          description:
            description?.trim() ||
            "",

          category:
            category || "other",

          sourceType:
            finalSourceType,

          videoUrl:
            finalVideoUrl,

          thumbnail:
            finalThumbnail,

          duration:
            Number(duration) ||
            0,

          tags: parseTags(tags),

          isPremium:
            parseBoolean(
              isPremium
            ),

          isFeatured:
            parseBoolean(
              isFeatured
            ),

          order:
            Number(order) || 0,

          createdBy:
            req.admin._id
        });

      const populatedHl = await Highlight.findById(highlight._id)
        .populate("matchId", "title teamA teamB sport status")
        .populate("seriesId", "title sport banner tournamentLogo status")
        .populate("teamA", "name shortName logo sport")
        .populate("teamB", "name shortName logo sport")
        .lean();

      res.status(201).json({
        success: true,
        message: "Highlight created",
        highlight: formatHighlight(req, populatedHl)
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message
      });
    }
  };

// GET HIGHLIGHTS
// GET /api/admin/highlights
exports.getHighlights =
  async (req, res) => {
    try {
      const {
        matchId,
        seriesId,
        page = 1,
        limit = 10
      } = req.query;

      const filter = {
        isDeleted: { $ne: true }
      };


      if (matchId) {
        filter.matchId = matchId;
      }

      if (seriesId) {
        filter.seriesId =
          seriesId;
      }

      const pageNum = Math.max(
        Number(page),
        1
      );

      const limitNum = Math.min(
        Math.max(Number(limit), 1),
        100
      );

      const skip =
        (pageNum - 1) *
        limitNum;

      const [highlights, total] =
        await Promise.all([
          Highlight.find(filter)

            .populate(
              "matchId",
              "title teamA teamB sport status"
            )

            .populate(
              "seriesId",
              "title sport banner tournamentLogo status"
            )

            .populate(
              "teamA",
              "name shortName logo sport"
            )

            .populate(
              "teamB",
              "name shortName logo sport"
            )


            .sort({
              order: 1,
              createdAt: -1
            })

            .skip(skip)

            .limit(limitNum)

            .lean(),

          Highlight.countDocuments(
            filter
          )
        ]);

      res.json({
        success: true,

        total,

        page: pageNum,

        limit: limitNum,

        totalPages: Math.ceil(
          total / limitNum
        ),

        count:
          highlights.length,

        highlights:
          highlights.map((h) =>
            formatHighlight(
              req,
              h
            )
          )
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message
      });
    }
  };

// GET SINGLE HIGHLIGHT
// GET /api/admin/highlights/:id
exports.getSingleHighlight =
  async (req, res) => {
    try {
      const highlight =
        await Highlight.findOne({
          _id: req.params.id,

          isDeleted: false
        })

          .populate(
            "matchId",
            "title teamA teamB sport status"
          )

          .populate(
            "seriesId",
            "name title tournamentName sport category"
          )

          .populate(
            "teamA",
            "name shortName logo sport"
          )

          .populate(
            "teamB",
            "name shortName logo sport"
          );

      if (!highlight) {
        return res.status(404).json({
          success: false,

          message:
            "Highlight not found"
        });
      }

      res.json({
        success: true,

        highlight:
          formatHighlight(
            req,
            highlight
          )
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message
      });
    }
  };

// UPDATE HIGHLIGHT
// PATCH /api/admin/highlights/:id
exports.updateHighlight =
  async (req, res) => {
    try {
      const existing =
        await Highlight.findOne({
          _id: req.params.id,

          isDeleted: false
        });

      if (!existing) {
        return res.status(404).json({
          success: false,

          message:
            "Highlight not found"
        });
      }

      const {
        title,
        description,
        category,
        sourceType,
        videoUrl,
        duration,
        tags,
        isPremium,
        isFeatured,
        order
      } = req.body;

      // Sanitize ObjectId fields — FormData sends empty strings/null strings which are truthy
      const matchId = sanitizeId(req.body.matchId);
      const seriesId = sanitizeId(req.body.seriesId);
      const teamA = sanitizeId(req.body.teamA);
      const teamB = sanitizeId(req.body.teamB);

      const updateData = {};

      // Match validation
      if (matchId) {
        const match =
          await Match.findById(
            matchId
          );

        if (!match) {
          return res.status(404).json({
            success: false,

            message:
              "Match not found"
          });
        }

        updateData.matchId =
          matchId;
      }

      // Series validation
      if (seriesId) {
        const series =
          await Series.findById(
            seriesId
          );

        if (!series) {
          return res.status(404).json({
            success: false,

            message:
              "Series not found"
          });
        }

        updateData.seriesId =
          seriesId;
      }

      // Team A validation
      if (teamA !== undefined) {
        if (teamA) {
          const teamADoc = await Team.findById(teamA);
          if (!teamADoc) {
            return res.status(404).json({
              success: false,
              message: "Team A not found"
            });
          }
        }
        updateData.teamA = teamA || null;
      }

      // Team B validation
      if (teamB !== undefined) {
        if (teamB) {
          const teamBDoc = await Team.findById(teamB);
          if (!teamBDoc) {
            return res.status(404).json({
              success: false,
              message: "Team B not found"
            });
          }
        }
        updateData.teamB = teamB || null;
      }

      if (title !== undefined) {
        updateData.title =
          title.trim();
      }

      if (
        description !== undefined
      ) {
        updateData.description =
          description.trim();
      }

      if (category !== undefined) {
        updateData.category =
          category;
      }

      if (duration !== undefined) {
        updateData.duration =
          Number(duration) ||
          0;
      }

      if (
        isPremium !== undefined
      ) {
        updateData.isPremium =
          parseBoolean(
            isPremium
          );
      }

      if (
        isFeatured !==
        undefined
      ) {
        updateData.isFeatured =
          parseBoolean(
            isFeatured
          );
      }

      if (order !== undefined) {
        updateData.order =
          Number(order) || 0;
      }

      if (tags !== undefined) {
        updateData.tags =
          parseTags(tags);
      }

      const effectiveSourceType =
        sourceType ||
        existing.sourceType;

      updateData.sourceType =
        effectiveSourceType;

      const deletePromises = [];
      const uploadPromises = [];
      const uploadKeys = [];

      // NEW VIDEO UPLOAD
      if (effectiveSourceType === "upload" && req.files?.videoFile?.[0]) {
        if (existing.sourceType === "upload" && existing.videoUrl) {
          deletePromises.push(deleteFromFirebase(existing.videoUrl));
        }
        uploadPromises.push(uploadToFirebase(req.files.videoFile[0], "highlights/videos"));
        uploadKeys.push("video");
      }

      // NEW VIDEO URL
      else if (effectiveSourceType === "url" && videoUrl !== undefined) {
        if (!isValidUrl(videoUrl)) {
          return res.status(400).json({
            success: false,
            message: "Invalid video URL"
          });
        }

        if (existing.sourceType === "upload" && existing.videoUrl) {
          deletePromises.push(deleteFromFirebase(existing.videoUrl));
        }

        updateData.videoUrl = videoUrl.trim();
      }

      // NEW THUMBNAIL
      if (req.files?.thumbnail?.[0]) {
        if (existing.thumbnail) {
          deletePromises.push(deleteFromFirebase(existing.thumbnail));
        }
        uploadPromises.push(uploadToFirebase(req.files.thumbnail[0], "highlights/thumbnails"));
        uploadKeys.push("thumbnail");
      }

      const [_, uploadedUrls] = await Promise.all([
        Promise.all(deletePromises),
        Promise.all(uploadPromises)
      ]);

      uploadKeys.forEach((key, index) => {
        if (key === "video") updateData.videoUrl = uploadedUrls[index];
        if (key === "thumbnail") updateData.thumbnail = uploadedUrls[index];
      });

      const highlight =
        await Highlight.findByIdAndUpdate(
          req.params.id,
          updateData,
          {
            new: true,
            runValidators: true
          }
        );

      const populatedHl = await Highlight.findById(highlight._id)
        .populate("matchId", "title teamA teamB sport status")
        .populate("seriesId", "title sport banner tournamentLogo status")
        .populate("teamA", "name shortName logo sport")
        .populate("teamB", "name shortName logo sport")
        .lean();

      res.json({
        success: true,
        message: "Highlight updated",
        highlight: formatHighlight(req, populatedHl)
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message
      });
    }
  };

// DELETE HIGHLIGHT
// DELETE /api/admin/highlights/:id
exports.deleteHighlight =
  async (req, res) => {
    try {
      const highlight =
        await Highlight.findOne({
          _id: req.params.id,

          isDeleted: false
        });

      if (!highlight) {
        return res.status(404).json({
          success: false,

          message:
            "Highlight not found"
        });
      }

      // Delete uploaded video
      if (
        highlight.sourceType ===
        "upload" &&
        highlight.videoUrl
      ) {
        await deleteFromFirebase(
          highlight.videoUrl
        );
      }

      // Delete thumbnail
      if (highlight.thumbnail) {
        await deleteFromFirebase(
          highlight.thumbnail
        );
      }

      // Soft delete
      highlight.isDeleted = true;

      highlight.deletedAt =
        new Date();

      await highlight.save();

      res.json({
        success: true,

        message:
          "Highlight deleted"
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message
      });
    }
  };