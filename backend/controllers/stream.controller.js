const streamService = require("../services/stream.service");

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

const formatStream = (req, doc) => {
  const stream = doc.toObject ? doc.toObject() : doc;

  return {
    ...stream,
    thumbnail: fileUrl(req, stream.thumbnail)
  };
};

// All Live Streams
exports.getLiveStreams = async (req, res) => {
  try {
    const streams = await streamService.getLiveStreams();

    res.json({
      success: true,
      count: streams.length,
      streams: streams.map((item) => formatStream(req, item))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Stream By Match
exports.getStreamByMatch = async (req, res) => {
  try {
    const stream = await streamService.getStreamByMatch(req.params.matchId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "No stream found for this match"
      });
    }

    res.json({
      success: true,
      stream: formatStream(req, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Single Stream
// exports.getSingleStream = async (req, res) => {
//   try {
//     const stream = await streamService.getStreamById(req.params.id);

//     if (!stream) {
//       return res.status(404).json({
//         success: false,
//         message: "Stream not found"
//       });
//     }

//     res.json({
//       success: true,
//       stream: formatStream(req, stream)
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };