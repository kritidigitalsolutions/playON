const Otp = require("../models/otp.model");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const axios = require("axios");
// const sendOtpSms = require("../utils/sendOtpSms");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const { rewardReferrer } = require("../utils/referralReward");

// =======================
// 🔑 REFERRAL HELPERS (GLOBAL)
// =======================
const generateReferralCode = () => {
  return "REF" + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const getUniqueReferralCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = generateReferralCode();
    const check = await User.findOne({ referralCode: code });
    if (!check) exists = false;
  }

  return code;
};

// =======================
// SEND OTP
// =======================
exports.sendOtp = async (
  req,
  res
) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number is required"
      });
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid mobile number"
      });
    }

    const recentOtp =
      await Otp.findOne({
        mobile,
        createdAt: {
          $gt: new Date(
            Date.now() - 60 * 1000
          )
        }
      });

    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message:
          "Please wait before requesting another OTP"
      });
    }

    const otp = Math.floor(
      100000 +
        Math.random() * 900000
    ).toString();

    console.log("OTP:", otp);

    await Otp.findOneAndUpdate(
      { mobile },
      {
        otp,
        expiresAt: new Date(
          Date.now() +
            5 * 60 * 1000
        )
      },
      {
        upsert: true,
        new: true
      }
    );

    // =======================
    // SMS SEND LOGIC
    // =======================

   const otpTemplate =
  process.env.SMS_GH_OTP_TEXT ||
  "Your OTP is {{otp}}";

const message =
  otpTemplate.replace(
    "{{otp}}",
    otp
  );

    console.log(
      "MESSAGE:",
      message
    );

    const formattedMobile = mobile.length === 10 ? `91${mobile}` : mobile;

    try {
      const response = await axios.post(
        "https://www.smsgatewayhub.com/api/mt/SendSMS",
        {
          params: {
            APIKey: process.env.SMS_GH_API_KEY,
            senderid: process.env.SMS_GH_SENDER_ID,
            channel: 2, // 2 = Transactional/OTP channel
            DCS: 0,
            flashsms: 0,
            number: formattedMobile,
            text: message,
            route: process.env.SMS_GH_ROUTE || 1,
            EntityId: process.env.SMS_GH_ENTITY_ID,
            dlttemplateid: process.env.SMS_GH_DLT_TEMPLATE_ID
          }
        }
      );

      console.log(
  "FULL SMS ERROR:",
  JSON.stringify(
    smsError.response?.data,
    null,
    2
  )
);

    } catch (smsError) {
      console.error(
        "SMS ERROR:",
        smsError.response?.data ||
          smsError.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to send OTP SMS",
        error:
          smsError.response?.data ||
          smsError.message
      });
    }

    // CHECK EXISTING USER
    const existingUser =
      await User.findOne({
        mobile,
        isDeleted: false
      });

    res.json({
      success: true,
      message:
        "OTP sent successfully",

      // ⚠️ COMMENTED FOR SECURITY
      // otp,

      // NEW USER STATUS
      isNewUser:
        !existingUser ||
        !existingUser.onboardingCompleted
    });

  } catch (error) {
    console.error(
      "SEND OTP ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
};

// =======================
// VERIFY OTP
// =======================
exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp, referralCode } = req.body;

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

    let referredByUser = null;

    if (referralCode) {
      referredByUser = await User.findOne({ referralCode });

      if (!referredByUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code"
        });
      }

      if (referredByUser.mobile === mobile) {
        return res.status(400).json({
          success: false,
          message: "You cannot refer yourself"
        });
      }
    }

    let user = await User.findOne({ mobile });
    let isNewUser = false;

    // =========================
    // NEW USER
    // =========================
    if (!user) {
      const newReferralCode = await getUniqueReferralCode();

      user = await User.create({
        mobile,
        referralCode: newReferralCode,
        referredBy: referredByUser?._id || null
      });

      // increment referral count
      if (referredByUser) {
        await User.findByIdAndUpdate(referredByUser._id, {
          $inc: { referralCount: 1 }
        });
        await rewardReferrer(referredByUser._id);
      }

      isNewUser = true;
    }

    // =========================
    // EXISTING USER
    // =========================
    else {
      if (!user.referralCode) {
        user.referralCode = await getUniqueReferralCode();
      }

      // prevent multiple referral usage
      if (referralCode && !user.referredBy) {
        user.referredBy = referredByUser._id;

        await User.findByIdAndUpdate(referredByUser._id, {
          $inc: { referralCount: 1 }
        });
      }

      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await Otp.deleteMany({ mobile });

    res.json({
      success: true,
      message: "OTP verified successfully",
      token,
      isNewUser,
      user,
      referralCode: user.referralCode
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================
// GOOGLE LOGIN
// =======================
exports.googleLogin = async (req, res) => {
  try {
    const { idToken, referralCode } = req.body;

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

    let user = await User.findOne({
      $or: [{ googleId }, { email }],
      isDeleted: false
    });

    let isNewUser = false;

    // =========================
    // EXISTING USER
    // =========================
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
      }

      if (!user.profilePic && profilePic) {
        user.profilePic = profilePic;
      }

      if (!user.fullName && fullName) {
        user.fullName = fullName;
      }

      if (!user.referralCode) {
        user.referralCode = await getUniqueReferralCode();
      }

      // apply referral only once
      if (referralCode && !user.referredBy) {
        const referredByUser = await User.findOne({ referralCode });

        if (!referredByUser) {
          return res.status(400).json({
            success: false,
            message: "Invalid referral code"
          });
        }

        if (referredByUser.email === email) {
          return res.status(400).json({
            success: false,
            message: "You cannot refer yourself"
          });
        }

        user.referredBy = referredByUser._id;

        await User.findByIdAndUpdate(referredByUser._id, {
          $inc: { referralCount: 1 }
        });
      }

      await user.save();
    }

    // =========================
    // NEW USER
    // =========================
    else {
      let referredByUser = null;

      if (referralCode) {
        referredByUser = await User.findOne({ referralCode });

        if (!referredByUser) {
          return res.status(400).json({
            success: false,
            message: "Invalid referral code"
          });
        }

        if (referredByUser.email === email) {
          return res.status(400).json({
            success: false,
            message: "You cannot refer yourself"
          });
        }
      }

      const newReferralCode = await getUniqueReferralCode();

      user = await User.create({
        googleId,
        email,
        fullName: fullName || "",
        profilePic: profilePic || "",
        authProvider: "google",
        isProfileComplete: !!fullName,
        referralCode: newReferralCode,
        referredBy: referredByUser?._id || null
      });

      // increment referral count
      if (referredByUser) {
        await User.findByIdAndUpdate(referredByUser._id, {
          $inc: { referralCount: 1 }
        });
        await rewardReferrer(referredByUser._id);
      }

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