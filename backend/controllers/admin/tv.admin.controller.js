const TvCode = require("../../models/tvCode.model");

const matchesSearch = (connection, search) => {
  if (!search) {
    return true;
  }

  const user = connection.user || {};
  const haystack = [
    user.fullName,
    user.email,
    user.mobile,
    connection.deviceName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search.toLowerCase());
};

exports.getTvConnections = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();

    const records = await TvCode.find({ used: true })
      .populate("userId", "fullName email mobile profilePic isProfileComplete accountStatus isDeleted createdAt")
      .sort({ updatedAt: -1 });

    const latestByUser = new Map();

    records.forEach((record) => {
      if (!record.userId?._id) {
        return;
      }

      const userKey = record.userId._id.toString();

      if (latestByUser.has(userKey)) {
        return;
      }

      latestByUser.set(userKey, {
        _id: record._id,
        deviceName: record.deviceName || "TV device",
        connectedAt: record.updatedAt || record.createdAt,
        codeUsedAt: record.updatedAt || record.createdAt,
        user: record.userId
      });
    });

    const connections = Array.from(latestByUser.values()).filter((connection) => matchesSearch(connection, search));

    res.json({
      success: true,
      count: connections.length,
      connections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
