const Otp = require("../models/otp.model");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const sendSmsOtp = async (mobile, otp) => {
  try {
    const text = process.env.SMS_GH_OTP_TEXT.replace("{{otp}}", otp);

    const url = "https://www.smsgatewayhub.com/api/mt/SendSMS";

    const response = await axios.get(url, {
      params: {
        APIKey: process.env.SMS_GH_API_KEY,
        senderid: process.env.SMS_GH_SENDER_ID,
        channel: 2,
        DCS: 0,
        flashsms: 0,
        number: `91${mobile}`,
        text: text,
        route: process.env.SMS_GH_ROUTE,
        EntityId: process.env.SMS_GH_ENTITY_ID,
        dlttemplateid: process.env.SMS_GH_DLT_TEMPLATE_ID
      }
    });

    console.log("SMS Response:", response.data);
    return true;
  } catch (error) {
    console.log("SMS Error:", error.response?.data || error.message);
    return false;
  }
};

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

    const smsSent = await sendSmsOtp(mobile, otp);

    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP SMS"
      });
    }

    res.json({
      success: true,
      message: "OTP sent successfully",
      isNewUser,
      otp
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
        message: "Mobile and OTP required"
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
      if (user.fullName && user.isProfileComplete) {
        isNewUser = false;
      }
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
      user: isNewUser ? null : user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};