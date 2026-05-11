const matchService = require("../../services/match.service");
const matchStreamSync = require("../../services/matchStreamSync.service");
const Comment = require("../../models/comment.model");
const uploadToFirebase = require("../../utils/uploadToFirebase");
const deleteFromFirebase = require("../../utils/deleteFromFirebase");
const autoNotify = require("../../utils/autoNotify");
const { 
  normalizeAdminStatus
} = require("../../services/matchStatus.service");


// helpers
const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return false;
};

const parseScoreSources = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const normalizeMatchBody = (body = {}, { includeDefaults = false } = {}) => {
  const data = matchStreamSync.stripStreamFields(body);

  delete data.score;

  if (includeDefaults || hasOwn(body, "scoreSources")) {
    data.scoreSources = parseScoreSources(body.scoreSources);
  }

  if (includeDefaults || hasOwn(body, "status") || hasOwn(body, "matchDate")) {
    data.status = normalizeAdminStatus(body.status, body.matchDate);
  }

  if (body.seriesId === "") {
    data.seriesId = null;
  }

  return data;
};

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

const formatMatch = (req, doc) => {
  const match = doc.toObject ? doc.toObject() : doc;

  return {
    ...match,
    isTrending: match.isTrending ?? false,
    isFeatured: match.isFeatured ?? false,
    isPremium: match.isPremium ?? false,

    thumbnail: fileUrl(req, match.thumbnail),
    banner: fileUrl(req, match.banner),
    teamALogo: fileUrl(req, match.teamALogo),
    teamBLogo: fileUrl(req, match.teamBLogo)
  };
};

const formatStream = (req, doc) => {
  if (!doc) return null;
  const stream = doc.toObject ? doc.toObject() : doc;

  return {
    ...stream,
    thumbnail: fileUrl(req, stream.thumbnail)
  };
};

const formatMatchWithStream = (req, match, stream) => ({
  ...formatMatch(req, match),
  stream: formatStream(req, stream)
});

// Create
exports.createMatch = async (req, res) => {
  try {
    let thumbnail = "";
    let banner = "";
    let teamALogo = "";
    let teamBLogo = "";

    if (req.files?.thumbnail?.[0]) {
      thumbnail = await uploadToFirebase(
        req.files.thumbnail[0],
        "matches"
      );
    }

    if (req.files?.banner?.[0]) {
      banner = await uploadToFirebase(
        req.files.banner[0],
        "matches"
      );
    }

    if (req.files?.teamALogo?.[0]) {
      teamALogo = await uploadToFirebase(
        req.files.teamALogo[0],
        "matches"
      );
    }

    if (req.files?.teamBLogo?.[0]) {
      teamBLogo = await uploadToFirebase(
        req.files.teamBLogo[0],
        "matches"
      );
    }

    const data = {
      ...normalizeMatchBody(req.body, { includeDefaults: true }),
      isFeatured: parseBoolean(req.body.isFeatured),
      isTrending: parseBoolean(req.body.isTrending),
      isPremium: parseBoolean(req.body.isPremium),
      thumbnail,
      banner,
      teamALogo,
      teamBLogo,
      createdBy: req.admin._id
    };

    if (data.status === "live" && !req.body.streamUrl?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Stream URL is required before going live"
      });
    }

    const match = await matchService.createMatch(data);
    const stream = await matchStreamSync.syncForMatch(match, req.body, {
      createdBy: req.admin._id
    });

    await autoNotify({
      title: "New Match Added",
      message: `${match.teamA} vs ${match.teamB} is now scheduled.`,
      type: "MATCH",
      metadata: {
        matchId: match._id,
        streamId: stream?._id,
        actionUrl: `/matches/${match._id}`,
        image: match.banner || match.thumbnail || ""
      }
    });
    res.status(201).json({
      success: true,
      message: "Match created successfully",
      match: formatMatchWithStream(req, match, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin List
exports.getAllMatches = async (req, res) => {
  try {
    const result = await matchService.getAdminMatches(req.query);
    const streamsByMatchId = await matchStreamSync.getStreamsByMatchIds(
      result.matches.map((item) => item._id)
    );

    res.json({
      success: true,
      ...result,
      matches: result.matches.map((item) =>
        formatMatchWithStream(req, item, streamsByMatchId.get(String(item._id)))
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Single
exports.getSingleMatch = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }
    const stream = await matchStreamSync.getLatestStreamByMatch(match._id);

    res.json({
      success: true,
      match: formatMatchWithStream(req, match, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMatchComments = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    const comments = await Comment.find({ itemId: req.params.id })
      .populate("userId", "fullName profilePic email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteMatchComment = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    const comment = await Comment.findOneAndDelete({
      _id: req.params.commentId,
      itemId: req.params.id
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    res.json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update
exports.updateMatch = async (req, res) => {
  try {
    const data = normalizeMatchBody(req.body);

    if (req.body.isFeatured !== undefined) {
      data.isFeatured = parseBoolean(req.body.isFeatured);
    }
    if (req.body.isTrending !== undefined) {
      data.isTrending = parseBoolean(req.body.isTrending);
    }
    if (req.body.isPremium !== undefined) {
      data.isPremium = parseBoolean(req.body.isPremium);
    }

    const existingMatch = await matchService.getMatchById(req.params.id);
    if (!existingMatch) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    if (
      hasOwn(req.body, "status") ||
      hasOwn(req.body, "matchDate")
    ) {
      data.status = normalizeAdminStatus(
        hasOwn(req.body, "status") ? req.body.status : existingMatch.status,
        hasOwn(req.body, "matchDate") ? req.body.matchDate : existingMatch.matchDate
      );
    }

    if (data.status === "live") {
      const existingStream = await matchStreamSync.getLatestStreamByMatch(existingMatch._id);
      if (!req.body.streamUrl?.trim() && !existingStream?.streamUrl) {
        return res.status(400).json({
          success: false,
          message: "Stream URL is required before going live"
        });
      }
    }

    if (req.files?.thumbnail?.[0]) {
      if (existingMatch.thumbnail) {
        await deleteFromFirebase(existingMatch.thumbnail);
      }
      data.thumbnail = await uploadToFirebase(
        req.files.thumbnail[0],
        "matches"
      );
    }


    if (req.files?.banner?.[0]) {
      if (existingMatch.banner) {
        await deleteFromFirebase(existingMatch.banner);
      }
      data.banner = await uploadToFirebase(
        req.files.banner[0],
        "matches"
      );
    }


    if (req.files?.teamALogo?.[0]) {
      if (existingMatch.teamALogo) {
        await deleteFromFirebase(existingMatch.teamALogo);
      }
      data.teamALogo = await uploadToFirebase(
        req.files.teamALogo[0],
        "matches"
      );
    }


    if (req.files?.teamBLogo?.[0]) {
      if (existingMatch.teamBLogo) {
        await deleteFromFirebase(existingMatch.teamBLogo);
      }
      data.teamBLogo = await uploadToFirebase(
        req.files.teamBLogo[0],
        "matches"
      );
    }


    const match = await matchService.updateMatch(req.params.id, data);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    const stream = await matchStreamSync.syncForMatch(match, req.body);

    if (existingMatch.status !== "live" && match.status === "live" && stream?.streamUrl) {
      await autoNotify({
        title: "Match Live Now",
        message: `${match.teamA} vs ${match.teamB} is live now.`,
        type: "STREAM",
        metadata: {
          matchId: match._id,
          streamId: stream._id,
          actionUrl: `/matches/${match._id}/watch`,
          image: stream.thumbnail || match.banner || match.thumbnail || ""
        }
      });
    }

    res.json({
      success: true,
      message: "Match updated successfully",
      match: formatMatchWithStream(req, match, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete
exports.deleteMatch = async (req, res) => {
  try {
    const match = await matchService.deleteMatch(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    if (match.thumbnail) await deleteFromFirebase(match.thumbnail);
    if (match.banner) await deleteFromFirebase(match.banner);
    if (match.teamALogo) await deleteFromFirebase(match.teamALogo);
    if (match.teamBLogo) await deleteFromFirebase(match.teamBLogo);

    await matchStreamSync.deleteStreamsForMatch(match._id);

    res.json({
      success: true,
      message: "Match deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle Featured
exports.toggleFeatured = async (req, res) => {
  try {
    const match = await matchService.toggleFeatured(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    res.json({
      success: true,
      message: "Featured updated",
      match: formatMatch(req, match)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Go Live
exports.goLive = async (req, res) => {
  try {
    const currentMatch = await matchService.getMatchById(req.params.id);

    if (!currentMatch) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    const stream = await matchStreamSync.markStreamLiveForMatch(currentMatch, req.body);
    const match = await matchService.goLive(req.params.id, req.body);

    await autoNotify({
      title: "Match Live Now",
      message: `${match.teamA} vs ${match.teamB} is live now.`,
      type: "STREAM",
      metadata: {
        matchId: match._id,
        streamId: stream?._id,
        actionUrl: `/matches/${match._id}/watch`,
        image: stream?.thumbnail || match.banner || match.thumbnail || ""
      }
    });
    res.json({
      success: true,
      message: "Match is now live",
      match: formatMatchWithStream(req, match, stream)
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

// End Live
exports.endLive = async (req, res) => {
  try {
    const match = await matchService.endLive(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }
    const stream = await matchStreamSync.endStreamForMatch(match._id);

    res.json({
      success: true,
      message: "Match ended",
      match: formatMatchWithStream(req, match, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.watchMatch = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }
    if (match.status !== "live") {
      return res.status(400).json({
        success: false,
        message: "Match is not live yet"
      });
    }

    const stream = await matchStreamSync.getLatestStreamByMatch(req.params.id);

    if (!stream || !stream.streamUrl) {
      return res.status(404).json({
        success: false,
        message: "No stream URL found for this match"
      });
    }
    if (stream.status !== "live") {
      return res.status(400).json({
        success: false,
        message: "Stream is not live yet"
      });
    }

    res.json({
      success: true,
      preview: true,
      stream: {
        streamUrl: stream.streamUrl,
        streamType: stream.streamType,
        backupUrl: stream.backupUrl,
        quality: stream.quality
      },
      match: formatMatchWithStream(req, match, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
