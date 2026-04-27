const Series = require("../models/series.model");
const Match = require("../models/match.model");
const User = require("../models/user.model");

//get all series with matches
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
        { tourCountry: { $regex: search, $options: "i" } },
        { teamA: { $regex: search, $options: "i" } },
        { teamB: { $regex: search, $options: "i" } }
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
      series
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
      .populate(
        "teamAPlayers",
        "name image team country"
      )
      .populate(
        "teamBPlayers",
        "name image team country"
      );

    if (!series) {
      return res.status(404).json({
        success: false,
        message: "Series not found"
      });
    }

    const matches = await Match.find({
      seriesId: id
    }).sort({ matchDate: 1 });

    res.json({
      success: true,
      series,
      matches
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET FEATURED SERIES
exports.getFeaturedSeries = async (req, res) => {
  try {
    const series = await Series.find({
      isFeatured: true
    })
      .populate("teamAPlayers", "name image team")
      .populate("teamBPlayers", "name image team")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      series
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// TOGGLE FOLLOW SERIES
exports.toggleFollowSeries = async (
  req,
  res
) => {
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
        (item) =>
          item.toString() === id
      );

    if (alreadyFollowing) {
      user.followedSeries =
        user.followedSeries.filter(
          (item) =>
            item.toString() !== id
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
exports.getFollowedSeries = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.user.userId
    ).select("followedSeries");

    const followedIds =
      user?.followedSeries || [];

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

      {
        $addFields: {
          totalMatches: {
            $size: "$matches"
          },

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
                        cond: {
                          $eq: [
                            "$$m.status",
                            "live"
                          ]
                        }
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
                            cond: {
                              $eq: [
                                "$$m.status",
                                "upcoming"
                              ]
                            }
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
                    {
                      $ne: [
                        "$$m.title",
                        ""
                      ]
                    },
                    "$$m.title",
                    {
                      $concat: [
                        "$$m.teamA",
                        " vs ",
                        "$$m.teamB"
                      ]
                    }
                  ]
                },
                date: "$$m.matchDate",
                status: "$$m.status"
              }
            }
          }
        }
      },

      {
        $sort: {
          createdAt: -1
        }
      }
    ]);

    res.json({
      success: true,
      count: series.length,
      series
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};