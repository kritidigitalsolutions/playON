const path = require("path");
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

  await firebaseFile.save(file.buffer, {
    metadata: {
      contentType: file.mimetype
    },
    public: true,
    validation: "md5"
  });

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};

module.exports = uploadToFirebase;