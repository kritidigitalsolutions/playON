const multer = require("multer");
const path = require("path");

// MEMORY STORAGE FOR VERCEL
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Thumbnail validation
  if (file.fieldname === "thumbnail") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Thumbnail must be an image file"
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
    fileSize: 25 * 1024 * 1024 // 25MB
  }
});

module.exports = highlightUpload;