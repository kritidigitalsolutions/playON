const TvCode = require("../models/tvCode.model");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

// Generate 4-digit code for logged-in mobile user
exports.generateCode = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Remove previous codes of same user
    await TvCode.deleteMany({ userId });

    let code;
    let exists = true;

    // Generate unique active code
    while (exists) {
      code = Math.floor(1000 + Math.random() * 9000).toString();

      exists = await TvCode.findOne({
        code,
        used: false,
        expiresAt: { $gt: new Date() }
      });
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await TvCode.create({
      code,
      userId,
      expiresAt
    });

    res.json({
      success: true,
      message: "TV code generated successfully",
      code,
      expiresIn: 300,
      expiresAt
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// TV login using 4-digit code
exports.loginWithCode = async (req, res) => {
  try {
    const { code, deviceName } = req.body;

    const cleanCode = String(code || "").trim();

    if (!cleanCode) {
      return res.status(400).json({
        success: false,
        message: "Code is required"
      });
    }

    const record = await TvCode.findOne({
      code: cleanCode,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired code"
      });
    }

    const user = await User.findById(record.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Mark code used
    record.used = true;
    record.deviceName = deviceName || "";
    await record.save();

    res.json({
      success: true,
      message: "TV login successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        profilePic: user.profilePic
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};