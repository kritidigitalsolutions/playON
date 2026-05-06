// const multer = require("multer");
// const path = require("path");

// // Store file in RAM temporarily
// const storage = multer.memoryStorage();

// const fileFilter = (req, file, cb) => {
//   const allowedExt = /jpg|jpeg|png|webp/;

//   const ext = allowedExt.test(
//     path.extname(file.originalname).toLowerCase()
//   );

//   const mime =
//     file.mimetype === "image/jpeg" ||
//     file.mimetype === "image/jpg" ||
//     file.mimetype === "image/png" ||
//     file.mimetype === "image/avif" ||
//     file.mimetype === "image/webp";

//   if (ext && mime) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed"));
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 4 * 1024 * 1024
//   }
// });

// module.exports = upload;
const multer = require("multer");
const path = require("path");

// Store file in RAM temporarily
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept ANY image MIME type
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024  // 4MB limit per file
  }
});

module.exports = upload;