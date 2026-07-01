const { bucket } = require("../config/firebase");

const deleteFromFirebase = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    let filePath = "";

    if (typeof fileUrl === "string" && fileUrl.startsWith("gs://")) {
      const withoutPrefix = fileUrl.replace("gs://", "");
      const firstSlash = withoutPrefix.indexOf("/");
      const bucketName = withoutPrefix.slice(0, firstSlash);
      filePath = withoutPrefix.slice(firstSlash + 1);

      if (bucketName !== bucket.name) {
        return;
      }
    } else {
      const url = new URL(fileUrl);
      const pathname = decodeURIComponent(url.pathname);
      const prefix = `/v0/b/${bucket.name}/o/`;

      if (pathname.startsWith(prefix)) {
        filePath = pathname.slice(prefix.length);
      } else if (pathname.startsWith(`/${bucket.name}/`)) {
        filePath = pathname.slice(bucket.name.length + 1);
      } else if (pathname.startsWith("/")) {
        filePath = pathname.slice(1);
      }
    }

    if (!filePath) return;

    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (exists) {
      await file.delete();
    }
  } catch (error) {
    console.log("Firebase delete error:", error.message);
  }
};

module.exports = deleteFromFirebase;