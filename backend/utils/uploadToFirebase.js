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
    await firebaseFile.save(file.buffer, fileOptions);
  } else if (file.path) {
    await bucket.upload(file.path, {
      destination: fileName,
      ...fileOptions
    });

    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error("Error deleting temp file:", err);
    }
  } else {
    throw new Error("File content (buffer or path) is missing");
  }

  // ✅ Token-based download URL — works regardless of UBLA/bucket privacy settings
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;
};

module.exports = uploadToFirebase;