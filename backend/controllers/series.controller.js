const Series = require("../models/series.model");
const Match = require("../models/match.model");
const User = require("../models/user.model");
const subscriptionService = require("../services/subscription.service");
const jwt = require("jsonwebtoken");

const getUserIdFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    return decoded?.userId || null;
  } catch { return null; }
};

const fileUrl = (req, filePath) => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/${filePath.replace(/\\/g, "/")}`;
};

const formatSeries = (req, series) => {
  const item = series.toObject ? series.toObject() : series;
  return {
    ...item,
    banner: fileUrl(req, item.banner),
    tournamentLogo: fileUrl(req, item.tournamentLogo),
    isPremium: !!item.isPremium
  };
};

// GET ALL SERIES WITH MATCHES
exports.getAllSeries = async (req, res) => {
  try {
    const { sport, status, search } = req.query;

    const filter = {};

    if (sport) filter.sport = sport.toLowerCase();
    if (status) filter.status = status.toLowerCase();

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tourCountry: { $regex: search, $options: "i" } }
      ];
    }

    const series = await Series.aggregate([
      { $match: filter },

      {
        $lookup: {
          from: "matches",
          localField: "_id",
          foreignField: "seriesId",
          as: "matches"
        }
      },

      // Populate teams
      {
        $lookup: {
          from: "teams",
          localField: "teams",
          foreignField: "_id",
          as: "teams"
        }
      },

      {
        $addFields: {
          totalMatches: { $size: "$matches" },

          matchScheduledDate: {
            $min: "$matches.matchDate"
          },

          matchStatus: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$matches",
                        as: "m",
                        cond: { $eq: ["$$m.status", "live"] }
                      }
                    }
                  },
                  0
                ]
              },
              "live",
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: "$matches",
                            as: "m",
                            cond: { $eq: ["$$m.status", "upcoming"] }
                          }
                        }
                      },
                      0
                    ]
                  },
                  "upcoming",
                  "completed"
                ]
              }
            ]
          },

          matches: {
            $map: {
              input: "$matches",
              as: "m",
              in: {
                _id: "$$m._id",
                matchName: {
                  $cond: [
                    { $ne: ["$$m.title", ""] },
                    "$$m.title",
                    { $concat: ["$$m.teamA", " vs ", "$$m.teamB"] }
                  ]
                },
                date: "$$m.matchDate",
                status: "$$m.status"
              }
            }
          }
        }
      },

      { $sort: { createdAt: -1 } }
    ]);

    const formattedSeries = series.map((s) => formatSeries(req, s));

    res.json({
      success: true,
      count: formattedSeries.length,
      series: formattedSeries
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE SERIES + MATCHES
exports.getSingleSeries = async (req, res) => {
  try {
    const { id } = req.params;

    const series = await Series.findById(id)
      .populate("teams", "name shortName logo sport country");

    if (!series) {
      return res.status(404).json({ success: false, message: "Series not found" });
    }

    // ✅ PREMIUM GATE
    if (series.isPremium) {
      const userId = getUserIdFromToken(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: "Login required to view premium content", locked: true, isPremium: true });
      }
      const hasAccess = await subscriptionService.checkAccess(userId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Active subscription required to view this series", locked: true, isPremium: true });
      }
    }

    const matches = await Match.find({ seriesId: id }).sort({ matchDate: 1 });

    res.json({
      success: true,
      series: formatSeries(req, series),
      matches: matches.map(m => ({ ...m.toObject(), isPremium: !!m.isPremium }))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET FEATURED SERIES
exports.getFeaturedSeries = async (req, res) => {
  try {
    const series = await Series.find({
      isFeatured: true
    })
      .populate("teams", "name shortName logo sport")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      series: series.map((s) => formatSeries(req, s))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// TOGGLE FOLLOW SERIES
exports.toggleFollowSeries = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const series = await Series.findById(id);

    if (!series) {
      return res.status(404).json({
        success: false,
        message: "Series not found"
      });
    }

    const user = await User.findById(userId);

    const alreadyFollowing =
      user.followedSeries.some(
        (item) => item.toString() === id
      );

    if (alreadyFollowing) {
      user.followedSeries =
        user.followedSeries.filter(
          (item) => item.toString() !== id
        );

      await user.save();

      return res.json({
        success: true,
        message: "Series unfollowed",
        isFollowing: false
      });
    }

    user.followedSeries.push(id);
    await user.save();

    res.json({
      success: true,
      message: "Series followed",
      isFollowing: true
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET FOLLOWED SERIES
exports.getFollowedSeries = async (req, res) => {
  try {
    const user = await User.findById(
      req.user.userId
    ).select("followedSeries");

    const followedIds = user?.followedSeries || [];

    const series = await Series.aggregate([
      {
        $match: {
          _id: { $in: followedIds }
        }
      },

      {
        $lookup: {
          from: "matches",
          localField: "_id",
          foreignField: "seriesId",
          as: "matches"
        }
      },

      // Populate teams
      {
        $lookup: {
          from: "teams",
          localField: "teams",
          foreignField: "_id",
          as: "teams"
        }
      },

      {
        $addFields: {
          totalMatches: { $size: "$matches" },

          matchScheduledDate: {
            $min: "$matches.matchDate"
          },

          matchStatus: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: "$matches",
                        as: "m",
                        cond: { $eq: ["$$m.status", "live"] }
                      }
                    }
                  },
                  0
                ]
              },
              "live",
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: "$matches",
                            as: "m",
                            cond: { $eq: ["$$m.status", "upcoming"] }
                          }
                        }
                      },
                      0
                    ]
                  },
                  "upcoming",
                  "completed"
                ]
              }
            ]
          },

          matches: {
            $map: {
              input: "$matches",
              as: "m",
              in: {
                _id: "$$m._id",
                matchName: {
                  $cond: [
                    { $ne: ["$$m.title", ""] },
                    "$$m.title",
                    { $concat: ["$$m.teamA", " vs ", "$$m.teamB"] }
                  ]
                },
                date: "$$m.matchDate",
                status: "$$m.status"
              }
            }
          }
        }
      },

      { $sort: { createdAt: -1 } }
    ]);

    res.json({
      success: true,
      count: series.length,
      series: series.map((s) => formatSeries(req, s))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
