const express = require("express");
const router = express.Router();

const {
  getPodcasts,
  getFeaturedPodcasts,
  getSinglePodcast
} = require("../../controllers/podcast.controller");

// GET ALL
router.get("/", getPodcasts);

// GET FEATURED
router.get("/featured", getFeaturedPodcasts);

// GET SINGLE
router.get("/:id", getSinglePodcast);

module.exports = router;