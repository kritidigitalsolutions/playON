const Otp = require("../models/otp.model");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// DEV MODE SMS (console)
const sendSmsOtp = async (mobile, otp) => {
  try {
    console.log("=================================");
    console.log("SMS DISABLED (DEV MODE)");
    console.log("Mobile:", mobile);
    console.log("OTP:", otp);
    console.log("=================================");
    return true;
  } catch (error) {
    return false;
  }
};

// =======================
// SEND OTP
// =======================
exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required"
      });
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number"
      });
    }

    const recentOtp = await Otp.findOne({
      mobile,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    });

    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const existingUser = await User.findOne({
      mobile,
      isDeleted: false
    });

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

    // 🔁 Replace delete+create with upsert (safer)
    await Otp.findOneAndUpdate(
      { mobile },
      {
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      },
      { upsert: true, new: true }
    );

    const smsSent = await sendSmsOtp(mobile, otp);

    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP SMS"
      });
    }

    // ⚠️ REMOVE OTP in production
    res.json({
      success: true,
      message: "OTP sent successfully",
      isNewUser,
      otp // keep for dev only
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================
// VERIFY OTP
// =======================
exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP required"
      });
    }

    const record = await Otp.findOne({
      mobile,
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    let user = await User.findOne({
      mobile,
      isDeleted: false
    });

    let isNewUser = true;

    if (!user) {
      user = await User.create({
        mobile,
        authProvider: "mobile"
      });
    } else if (user.isDeleted) {
      user.isDeleted = false;
      user.deletedAt = null;
      user.deleteReason = "";
      user.accountStatus = "active";

      user.fullName = "";
      user.email = null;
      user.profilePic = "";
      user.favoriteSports = [];
      user.isProfileComplete = false;
      user.fcmToken = "";

      await user.save();
    } else {
      if (user.fullName && user.isProfileComplete) {
        isNewUser = false;
      }
    }

    const token = jwt.sign(
      { userId: user._id, provider: "mobile" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await Otp.deleteMany({ mobile });

    res.json({
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

// =======================
// GOOGLE LOGIN (FIXED)
// =======================
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "idToken is required"
      });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const fullName = payload.name;
    const profilePic = payload.picture;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google email not available"
      });
    }

    // 🔥 FIX: prevent duplicate users
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
      isDeleted: false
    });

    let isNewUser = false;

    if (user) {
      // 🔗 Link google if not linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        await user.save();
      }
    } else {
      user = await User.create({
        googleId,
        email,
        fullName: fullName || "",
        profilePic: profilePic || "",
        authProvider: "google",
        isProfileComplete: !!fullName
      });

      isNewUser = true;
    }

    const token = jwt.sign(
      { userId: user._id, provider: "google" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Google login successful",
      token,
      isNewUser,
      user
    });

  } catch (error) {
  console.error("Google login FULL ERROR:", error);

  res.status(500).json({
    success: false,
    message: error.message
  });
}
};