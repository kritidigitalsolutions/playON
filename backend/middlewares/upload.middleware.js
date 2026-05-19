const multer = require("multer");
const path = require("path");

// Store image temporarily in RAM
// Safe because images are small
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow only image MIME types
  if (!file.mimetype.startsWith("image/")) {
    return cb(
      new Error("Only image files are allowed")
    );
  }

  // Allowed extensions
  const allowedExt =
    /jpg|jpeg|png|webp|avif/i;

  const ext = allowedExt.test(
    path
      .extname(file.originalname)
      .toLowerCase()
  );

  if (!ext) {
    return cb(
      new Error(
        "Only JPG, JPEG, PNG, WEBP, AVIF allowed"
      )
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,

  fileFilter,

  limits: {
    // 5MB per image
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = upload;