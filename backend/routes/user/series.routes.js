const express = require("express");
const router = express.Router();

const {
  getAllSeries,
  getSingleSeries,
  getFeaturedSeries,
  toggleFollowSeries,
  getFollowedSeries
} = require("../../controllers/series.controller");

const {
  isAuth
} = require("../../middlewares/auth.middleware");

// Public Routes
router.get("/", getAllSeries);
router.get("/featured", getFeaturedSeries);

// Protected Follow Routes
router.get(
  "/followed",
  isAuth,
  getFollowedSeries
);

router.patch(
  "/:id/follow",
  isAuth,
  toggleFollowSeries
);

// Public Single
router.get("/:id", getSingleSeries);

module.exports = router;