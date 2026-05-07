const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create temp folder if not exists
const tempDir = "temp";

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Store files temporarily on disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName +
        path.extname(file.originalname)
    );
  }
});

const fileFilter = (req, file, cb) => {
  // Thumbnail image validation
  if (file.fieldname === "thumbnail") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }

    return cb(
      new Error(
        'Thumbnail must be an image file'
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
    // Max upload size per file
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

module.exports = highlightUpload;