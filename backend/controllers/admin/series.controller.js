const Series = require("../../models/series.model");
const Match = require("../../models/match.model");
const uploadToFirebase = require("../../utils/uploadToFirebase");

// helper
const fileUrl = (req, filePath) => {
  if (!filePath) return "";

  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://")
  ) {
    return filePath;
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/${filePath.replace(/\\/g, "/")}`;
};

const makeSlug = (text = "") => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

// CREATE SERIES
exports.createSeries = async (req, res) => {
  try {
    const {
      title,
      sport,
      description,
      teamA,
      teamB,
      teamAPlayers,
      teamBPlayers,
      tourCountry,
      startDate,
      endDate,
      status,
      isFeatured,
      matchIds
    } = req.body;

    if (!title || !sport) {
      return res.status(400).json({
        success: false,
        message: "Title and sport are required"
      });
    }

    const cleanTitle = title.trim();
    const cleanSport = sport.toLowerCase().trim();

    const existing = await Series.findOne({
      title: cleanTitle,
      sport: cleanSport
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Series already exists"
      });
    }

    let bannerUrl = "";

    if (req.file) {
      bannerUrl = await uploadToFirebase(req.file, "series");
    }

    const series = await Series.create({
      title: cleanTitle,
      sport: cleanSport,
      slug: makeSlug(cleanTitle),
      banner: bannerUrl,
      description: description || "",

      teamA: teamA || "",
      teamB: teamB || "",

      teamAPlayers: teamAPlayers
        ? Array.isArray(teamAPlayers)
          ? teamAPlayers
          : [teamAPlayers]
        : [],

      teamBPlayers: teamBPlayers
        ? Array.isArray(teamBPlayers)
          ? teamBPlayers
          : [teamBPlayers]
        : [],

      tourCountry: tourCountry || "",

      startDate: startDate || null,
      endDate: endDate || null,
      status: status || "upcoming",
      isFeatured:
        isFeatured === true || isFeatured === "true",
      createdBy: req.admin.adminId
    });

    let linkedMatches = 0;

    if (matchIds) {
      const ids = Array.isArray(matchIds)
        ? matchIds
        : [matchIds];

      const updateResult = await Match.updateMany(
        { _id: { $in: ids } },
        { seriesId: series._id }
      );

      linkedMatches = updateResult.modifiedCount || 0;
    }

    res.status(201).json({
      success: true,
      message: "Series created successfully",
      linkedMatches,
      series: {
        ...series.toObject(),
        banner: fileUrl(req, series.banner)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL SERIES
exports.getAllSeries = async (req, res) => {
  try {
    const {
      search,
      sport,
      status,
      page = 1,
      limit = 10
    } = req.query;

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

    const skip =
      (Number(page) - 1) * Number(limit);

    const [series, total] = await Promise.all([
      Series.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Series.countDocuments(filter)
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
      series: series.map((item) => ({
        ...item.toObject(),
        banner: fileUrl(req, item.banner)
      }))
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
      .populate("teamAPlayers", "name team country sport")
      .populate("teamBPlayers", "name team country sport");

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
      series: {
        ...series.toObject(),
        banner: fileUrl(req, series.banner)
      },
      matches
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE SERIES
exports.updateSeries = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      sport,
      description,
      teamA,
      teamB,
      teamAPlayers,
      teamBPlayers,
      tourCountry,
      startDate,
      endDate,
      status,
      isFeatured,
      matchIds
    } = req.body;

    const series = await Series.findById(id);

    if (!series) {
      return res.status(404).json({
        success: false,
        message: "Series not found"
      });
    }

    const cleanTitle = title
      ? title.trim()
      : series.title;

    const cleanSport = sport
      ? sport.toLowerCase().trim()
      : series.sport;

    series.title = cleanTitle;
    series.sport = cleanSport;
    series.slug = makeSlug(cleanTitle);

    series.description =
      description !== undefined
        ? description
        : series.description;

    if (teamA !== undefined) {
      series.teamA = teamA || "";
    }

    if (teamB !== undefined) {
      series.teamB = teamB || "";
    }

    if (teamAPlayers !== undefined) {
      series.teamAPlayers = Array.isArray(teamAPlayers)
        ? teamAPlayers
        : teamAPlayers
        ? [teamAPlayers]
        : [];
    }

    if (teamBPlayers !== undefined) {
      series.teamBPlayers = Array.isArray(teamBPlayers)
        ? teamBPlayers
        : teamBPlayers
        ? [teamBPlayers]
        : [];
    }

    if (tourCountry !== undefined) {
      series.tourCountry = tourCountry || "";
    }

    series.startDate =
      startDate !== undefined
        ? startDate || null
        : series.startDate;

    series.endDate =
      endDate !== undefined
        ? endDate || null
        : series.endDate;

    series.status = status || series.status;

    if (isFeatured !== undefined) {
      series.isFeatured =
        isFeatured === true ||
        isFeatured === "true";
    }

    if (req.file) {
      const bannerUrl = await uploadToFirebase(
        req.file,
        "series"
      );
      series.banner = bannerUrl;
    }

    await series.save();
    await series.populate([
      { path: "teamAPlayers", select: "name team country sport" },
      { path: "teamBPlayers", select: "name team country sport" }
    ]);

    if (matchIds !== undefined) {
      const ids = Array.isArray(matchIds)
        ? matchIds
        : matchIds
        ? [matchIds]
        : [];

      await Match.updateMany(
        { seriesId: id },
        { seriesId: null }
      );

      if (ids.length > 0) {
        await Match.updateMany(
          { _id: { $in: ids } },
          { seriesId: id }
        );
      }
    }

    res.json({
      success: true,
      message: "Series updated successfully",
      series
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE SERIES
exports.deleteSeries = async (req, res) => {
  try {
    const { id } = req.params;

    const series = await Series.findById(id);

    if (!series) {
      return res.status(404).json({
        success: false,
        message: "Series not found"
      });
    }

    await Match.updateMany(
      { seriesId: id },
      { seriesId: null }
    );

    await Series.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Series deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};