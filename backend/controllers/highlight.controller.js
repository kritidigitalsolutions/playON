const Highlight = require("../models/highlight.model");

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
    ),

    liveLogo: resolveUrl(
      req,
      h.liveLogo
    )
  };
};

// GET HIGHLIGHTS
// GET /api/highlights
// GET /api/highlights?matchId=xxx
// GET /api/highlights?seriesId=xxx
// GET /api/highlights?category=goal
exports.getHighlightsByMatch =
  async (req, res) => {
    try {
      const {
        matchId,
        seriesId,
        category,
        page = 1,
        limit = 10
      } = req.query;

      const filter = {
        isDeleted: { $ne: true }
      };


      // Match filter
      if (matchId) {
        filter.matchId = matchId;
      }

      // Series filter
      if (seriesId) {
        filter.seriesId = seriesId;
      }

      // Category filter
      if (category) {
        filter.category = category;
      }

      // Pagination safety
      const pageNum = Math.max(
        Number(page),
        1
      );

      const limitNum = Math.min(
        Math.max(Number(limit), 1),
        50
      );

      const skip =
        (pageNum - 1) * limitNum;

      const [highlights, total] =
        await Promise.all([
          Highlight.find(filter)

            .populate(
              "matchId",
              "title teamA teamB sport tournament status"
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

            .select(
              "-createdBy -deletedAt"
            )

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

        count: highlights.length,

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
// GET /api/highlights/:id
exports.getSingleHighlight =
  async (req, res) => {
    try {
      const highlight =
        await Highlight.findOne({
          _id: req.params.id,

          isDeleted: { $ne: true }
        })


          .populate(
            "matchId",
            "title teamA teamB sport tournament status"
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


          .select(
            "-createdBy -deletedAt"
          )

          .lean();

      if (!highlight) {
        return res.status(404).json({
          success: false,

          message:
            "Highlight not found"
        });
      }

      // Increment views
      await Highlight.findByIdAndUpdate(
        req.params.id,
        {
          $inc: {
            views: 1
          }
        }
      );

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