const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { bucket } = require("../config/firebase");

const uploadToFirebase = async (file, folder = "general") => {
  if (!file) return "";

  const ext = path.extname(file.originalname);
  const cleanName = path
    .basename(file.originalname, ext)
    .replace(/\s+/g, "-")
    .toLowerCase();

  const fileName = `${folder}/${Date.now()}-${cleanName}${ext}`;
  const firebaseFile = bucket.file(fileName);
  const downloadToken = crypto.randomUUID();

  const fileOptions = {
    metadata: {
      contentType: file.mimetype,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken
      }
    },
    validation: "md5"
  };

  if (file.buffer) {
    // Memory Storage
    await firebaseFile.save(file.buffer, fileOptions);
  } else if (file.path) {
    // Disk Storage
    await bucket.upload(file.path, {
      destination: fileName,
      ...fileOptions
    });

    // Clean up local temp file
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error("Error deleting temp file:", err);
    }
  } else {
    throw new Error("File content (buffer or path) is missing");
  }

  await firebaseFile.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};

module.exports = uploadToFirebase;
