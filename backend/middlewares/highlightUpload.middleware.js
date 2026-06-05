const multer = require("multer");
const path = require("path");
const os = require("os");

// Stream large files to temporary disk directory instead of RAM buffer to prevent crashes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Thumbnail and Live Logo validation
  if (file.fieldname === "thumbnail" || file.fieldname === "liveLogo") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }

    return cb(
      new Error(
        `${file.fieldname === "thumbnail" ? "Thumbnail" : "Live Logo"} must be an image file`
      )
    );
  }

  // Video validation
  if (file.fieldname === "videoFile") {
    const allowedVideo =
      /mp4|mov|mkv|webm/i;

    const ext = allowedVideo.test(
      path
        .extname(file.originalname)
        .toLowerCase()
    );

    const mime =
      file.mimetype.startsWith("video/");

    if (ext && mime) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Only MP4, MOV, MKV, WEBM videos are allowed"
      )
    );
  }

  return cb(
    new Error(
      `Unsupported field: ${file.fieldname}`
    )
  );
};

const highlightUpload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }
});

module.exports = highlightUpload;