const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "thumbnail" && file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  if (
    file.fieldname === "videoFile" &&
    (file.mimetype.startsWith("video/") || file.mimetype === "application/octet-stream")
  ) {
    return cb(null, true);
  }
  cb(new Error(`Unsupported file type for field "${file.fieldname}"`));
};

const highlightUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB per file
  }
});

// .fields([{ name: "thumbnail", maxCount: 1 }, { name: "videoFile", maxCount: 1 }])
module.exports = highlightUpload;
