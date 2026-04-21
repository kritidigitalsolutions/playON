const User = require("../models/user.model");

exports.deleteMyAccount = async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findOne({
      _id: req.user.userId,
      isDeleted: false
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deleteReason = reason || "";
    user.accountStatus = "deleted";

    // optional cleanup
    user.isProfileComplete = false;
    user.email = "";
    user.profilePic = "";
    user.favoriteSports = [];
    user.followedPlayers = [];

    await user.save();

    return res.json({
      success: true,
      message: "Account deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};