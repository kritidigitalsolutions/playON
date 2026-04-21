const streamService = require("../../services/stream.service");
const uploadToFirebase = require("../../utils/uploadToFirebase");
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

const formatStream = (req, doc) => {
  const stream = doc.toObject ? doc.toObject() : doc;

  return {
    ...stream,
    thumbnail: fileUrl(req, stream.thumbnail)
  };
};

// Create
exports.createStream = async (req, res) => {
  try {
   let thumbnail = "";

if (req.file) {
  thumbnail = await uploadToFirebase(req.file, "streams");
}

const data = {
  ...req.body,
  thumbnail,
  createdBy: req.admin._id
};
    const stream = await streamService.createStream(data);

    res.status(201).json({
      success: true,
      message: "Stream created successfully",
      stream: formatStream(req, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// List
exports.getStreams = async (req, res) => {
  try {
    const result = await streamService.getStreams(req.query);

    res.json({
      success: true,
      ...result,
      streams: result.streams.map((item) => formatStream(req, item))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Single
exports.getSingleStream = async (req, res) => {
  try {
    const stream = await streamService.getStreamById(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found"
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

// Update
exports.updateStream = async (req, res) => {
  try {
    const data = {
      ...req.body
    };
if (req.file) {
  data.thumbnail = await uploadToFirebase(req.file, "streams");
}

    const stream = await streamService.updateStream(req.params.id, data);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found"
      });
    }

    res.json({
      success: true,
      message: "Stream updated successfully",
      stream: formatStream(req, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete
exports.deleteStream = async (req, res) => {
  try {
    const stream = await streamService.deleteStream(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found"
      });
    }

    res.json({
      success: true,
      message: "Stream deleted successfully"
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
    const stream = await streamService.goLive(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found"
      });
    }

    await autoNotify({
  title: "Live Stream Started",
  message: `${stream.title} is live now.`,
  type: "STREAM",
  metadata: {
    streamId: stream._id
  }
});

    res.json({
      success: true,
      message: "Stream is now live",
      stream: formatStream(req, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// End Stream
exports.endStream = async (req, res) => {
  try {
    const stream = await streamService.endStream(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found"
      });
    }

    res.json({
      success: true,
      message: "Stream ended",
      stream: formatStream(req, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.watchStream = async (req, res) => {
  try {
    const stream = await streamService.getStreamById(req.params.id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found"
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
      stream: formatStream(req, stream)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};