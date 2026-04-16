const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  completeProfile,
  getProfile,
  updateProfile
} = require("../../controllers/user.controller");

router.put("/complete-profile", isAuth, completeProfile);
router.get("/profile", isAuth, getProfile);

router.put(
  "/update-profile",
  isAuth,
  upload.single("profileImage"),
  updateProfile
);

module.exports = router;