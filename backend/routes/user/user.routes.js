const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/upload.middleware");

const referralController = require("../../controllers/referral.controller");

const {
  completeProfile,
  getProfile,
  updateProfile,
  saveFcmToken
} = require("../../controllers/user.controller");

// =======================
// USER PROFILE
// =======================
router.put("/complete-profile", isAuth, completeProfile);
router.get("/profile", isAuth, getProfile);

router.patch(
  "/update-profile",
  isAuth,
  upload.single("profileImage"),
  updateProfile
);

// =======================
// REFERRAL SYSTEM
// =======================
router.get(
  "/referral-code",
  isAuth,
  referralController.getMyReferralCode
);


router.get(
  "/referral-dashboard",
  isAuth,
  referralController.getReferralDashboard
);
const { getReferralVouchers , getReferralOffer} = require("../../controllers/referralVoucher.controller");

router.get(
  "/referral-voucher",
  isAuth,
  getReferralVouchers
);
router.get("/referral-offer", getReferralOffer);
// =======================
// OTHER
// =======================
router.patch("/fcm-token", isAuth, saveFcmToken);

module.exports = router;