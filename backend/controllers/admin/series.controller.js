const Series = require("../../models/series.model");
const Match = require("../../models/match.model");
const Highlight = require("../../models/highlight.model");
const uploadToFirebase = require("../../utils/uploadToFirebase");
const deleteFromFirebase = require("../../utils/deleteFromFirebase");
const autoNotify = require("../../utils/autoNotify");

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

const asArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const formatSeries = (req, series) => {
  const item = series.toObject ? series.toObject() : series;
  return {
    ...item,
    banner: fileUrl(req, item.banner),
    tournamentLogo: fileUrl(req, item.tournamentLogo)
  };
};

// CREATE SERIES
exports.createSeries = async (req, res) => {
  try {
    const {
      title,
      sport,
      description,
      teams,
      tourCountry,
      startDate,
      endDate,
      status,
      isFeatured,
      isTrending,
      isPremium,
      isHomeScreen,
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

    const uploadPromises = [];
    const uploadKeys = [];

    if (req.files?.banner?.[0]) {
      uploadPromises.push(uploadToFirebase(req.files.banner[0], "series"));
      uploadKeys.push("banner");
    }

    if (req.files?.tournamentLogo?.[0]) {
      uploadPromises.push(uploadToFirebase(req.files.tournamentLogo[0], "series"));
      uploadKeys.push("tournamentLogo");
    }

    const uploadedUrls = await Promise.all(uploadPromises);

    let bannerUrl = "";
    let tournamentLogoUrl = "";

    uploadKeys.forEach((key, index) => {
      if (key === "banner") bannerUrl = uploadedUrls[index];
      if (key === "tournamentLogo") tournamentLogoUrl = uploadedUrls[index];
    });

    const series = await Series.create({
      title: cleanTitle,
      sport: cleanSport,
      slug: makeSlug(cleanTitle),
      banner: bannerUrl,
      tournamentLogo: tournamentLogoUrl,
      description: description || "",

      teams: asArray(teams),

      tourCountry: tourCountry || "",

      startDate: startDate || null,
      endDate: endDate || null,
      status: status || "upcoming",
      isFeatured:
        isFeatured === true || isFeatured === "true",
      isTrending:
        isTrending === true || isTrending === "true",
      isPremium:
        isPremium === true || isPremium === "true",
      isHomeScreen:
        isHomeScreen === true || isHomeScreen === "true",
      createdBy: req.admin._id
    });

    // 🔔 AUTO NOTIFY FOR NEW SERIES
    await autoNotify({
      title: "New Series Added",
      message: `${series.title} is now available`,
      type: "SERIES",
      metadata: {
        image: bannerUrl,
        seriesId: series._id
      }
    });

    let linkedMatches = 0;

    if (matchIds) {
      const ids = asArray(matchIds);

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
      series: formatSeries(req, series)
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

    const fetchAll = String(limit).toLowerCase() === "all";
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const seriesQuery = Series.find(filter)
      .populate("teams", "name shortName logo sport country")
      .sort({ createdAt: -1 });

    if (!fetchAll) {
      seriesQuery.skip(skip).limit(limitNum);
    }

    const [series, total] = await Promise.all([
      seriesQuery,
      Series.countDocuments(filter)
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: fetchAll ? total : limitNum,
      pages: fetchAll ? 1 : Math.ceil(total / limitNum),
      series: series.map((item) => formatSeries(req, item))
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
      .populate("teams", "name shortName logo sport country isActive");

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
        ...formatSeries(req, series)
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
      teams,
      tourCountry,
      startDate,
      endDate,
      status,
      isFeatured,
      isTrending,
      isPremium,
      isHomeScreen,
      matchIds
    } = req.body;

    const series = await Series.findById(id);

    if (!series) {
      return res.status(404).json({
        success: false,
        message: "Series not found"
      });
    }

    const oldStatus = series.status;

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

    if (teams !== undefined) {
      series.teams = asArray(teams);
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
    if (isTrending !== undefined) {
      series.isTrending =
        isTrending === true ||
        isTrending === "true";
    }

    if (isPremium !== undefined) {
      series.isPremium =
        isPremium === true ||
        isPremium === "true";
    }

    if (isHomeScreen !== undefined) {
      series.isHomeScreen =
        isHomeScreen === true ||
        isHomeScreen === "true";
    }

    const deletePromises = [];
    const uploadPromises = [];
    const uploadKeys = [];

    if (req.files?.banner?.[0]) {
      if (series.banner) deletePromises.push(deleteFromFirebase(series.banner));
      uploadPromises.push(uploadToFirebase(req.files.banner[0], "series"));
      uploadKeys.push("banner");
    }

    if (req.files?.tournamentLogo?.[0]) {
      if (series.tournamentLogo) deletePromises.push(deleteFromFirebase(series.tournamentLogo));
      uploadPromises.push(uploadToFirebase(req.files.tournamentLogo[0], "series"));
      uploadKeys.push("tournamentLogo");
    }

    const [_, uploadedUrls] = await Promise.all([
      Promise.all(deletePromises),
      Promise.all(uploadPromises)
    ]);

    uploadKeys.forEach((key, index) => {
      series[key] = uploadedUrls[index];
    });

    await series.save();
    await series.populate([
      { path: "teams", select: "name shortName logo sport country isActive" }
    ]);

    // 🔔 AUTO NOTIFY IF SERIES GOES LIVE
    if (oldStatus !== "live" && series.status === "live") {
      await autoNotify({
        title: "Series Live Now",
        message: `${series.title} is live now!`,
        type: "SERIES",
        metadata: {
          seriesId: series._id,
          image: series.banner || series.tournamentLogo || "",
          actionUrl: `/series/${series._id}`
        }
      });
    }

    if (matchIds !== undefined) {
      const ids = asArray(matchIds);

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
      series: formatSeries(req, series)
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

    // Delete connected highlights
    const highlights = await Highlight.find({ seriesId: id });
    for (const highlight of highlights) {
      if (highlight.sourceType === "upload" && highlight.videoUrl) {
        await deleteFromFirebase(highlight.videoUrl);
      }
      if (highlight.thumbnail) {
        await deleteFromFirebase(highlight.thumbnail);
      }
    }
    await Highlight.deleteMany({ seriesId: id });

    if (series.banner) await deleteFromFirebase(series.banner);
    if (series.tournamentLogo) await deleteFromFirebase(series.tournamentLogo);

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
