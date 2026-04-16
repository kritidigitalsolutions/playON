const Otp = require("../models/otp.model");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const existingUser = await User.findOne({ mobile });

    let isNewUser = true;

    if (existingUser) {
      const hasFullName =
        existingUser.fullName &&
        existingUser.fullName.trim() !== "";

      const profileDone =
        existingUser.isProfileComplete === true;

      if (hasFullName && profileDone) {
        isNewUser = false;
      }
    }

    await Otp.deleteMany({ mobile });

    await Otp.create({
      mobile,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    console.log(`OTP for ${mobile}: ${otp}`);

    res.json({
      success: true,
      message: "OTP sent successfully",
      otp,
      isNewUser
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP are required"
      });
    }

    const record = await Otp.findOne({ mobile, otp });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    let user = await User.findOne({ mobile });
    let isNewUser = true;

    if (!user) {
      user = await User.create({ mobile });
    } else {
      const hasFullName =
        user.fullName &&
        user.fullName.trim() !== "";

      const profileDone =
        user.isProfileComplete === true;

      if (hasFullName && profileDone) {
        isNewUser = false;
      }
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await Otp.deleteMany({ mobile });

    return res.json({
      success: true,
      message: "OTP verified successfully",
      token,
      isNewUser,
      user: isNewUser ? null : user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};