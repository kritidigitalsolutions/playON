const { bucket } = require("../config/firebase");

const deleteFromFirebase = async (
  fileUrl
) => {
  try {
    if (!fileUrl) return;

    const url = new URL(fileUrl);

    const filePath = decodeURIComponent(
      url.pathname.replace(
        `/${bucket.name}/`,
        ""
      )
    );

    const file = bucket.file(filePath);

    const [exists] = await file.exists();

    if (exists) {
      await file.delete();
    }

  } catch (error) {
    console.log(
      "Firebase delete error:",
      error.message
    );
  }
};

module.exports = deleteFromFirebase;