const User = require("../models/user.model");
const uploadToFirebase = require("../utils/uploadToFirebase");

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

    // Only first-time onboarding allowed
    if (user.isProfileComplete === true) {
      return res.status(400).json({
        success: false,
        message: "Profile already completed. Use update profile."
      });
    }

    user.fullName = fullName.trim();
    user.favoriteSports = Array.isArray(favoriteSports)
      ? favoriteSports
      : favoriteSports
      ? [favoriteSports]
      : [];

    user.isProfileComplete = true;

    await user.save();

    res.json({
      success: true,
      message: "Profile completed successfully",
      user
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

// UPDATE PROFILE
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

    if (mobile) {
      updateData.mobile = mobile.trim();
    }

    if (favoriteSports) {
      updateData.favoriteSports = Array.isArray(favoriteSports)
        ? favoriteSports
        : [favoriteSports];
    }

    if (req.file) {
      updateData.profilePic = await uploadToFirebase(
        req.file,
        "profiles"
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.user.userId,
        isDeleted: false
      },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

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


//save token
exports.saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;

    await User.findByIdAndUpdate(
      req.user.userId,
      { fcmToken: token },
      { new: true }
    );

    res.json({
      success: true,
      message: "Token saved"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};