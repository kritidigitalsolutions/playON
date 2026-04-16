const User = require("../models/user.model");


// COMPLETE PROFILE / FIRST TIME SETUP
exports.completeProfile = async (req, res) => {
  try {
    const { fullName, favoriteSports } = req.body;

    if (!fullName || fullName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 3 characters"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        fullName: fullName.trim(),
        favoriteSports: favoriteSports || [],
        isProfileComplete: true
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile completed successfully",
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// UPDATE PROFILE LATER
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, email, favoriteSports, mobile } = req.body;

    const updateData = {};

    if (fullName) {
      updateData.fullName = fullName.trim();
      updateData.isProfileComplete = true;
    }

    if (email) {
      updateData.email = email.trim().toLowerCase();
    }

if(mobile){
  updateData.mobile=mobile.trim();
}

    if (favoriteSports) {
      updateData.favoriteSports = Array.isArray(favoriteSports)
        ? favoriteSports
        : [favoriteSports];
    }

    if (req.file) {
      updateData.profilePic =
        `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};