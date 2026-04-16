const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  createMatch,
  getAllMatches,
  getSingleMatch,
  updateMatch,
  deleteMatch,
  toggleFeatured,
  goLive,
  endLive
} = require("../../controllers/admin/match.controller");

// shared upload fields
const matchUploads = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: "teamALogo", maxCount: 1 },
  { name: "teamBLogo", maxCount: 1 }
]);

// Create
router.post("/create", isAdmin, matchUploads, createMatch);

// List
router.get("/", isAdmin, getAllMatches);

// Single
router.get("/:id", isAdmin, getSingleMatch);

// Update
router.put("/:id", isAdmin, matchUploads, updateMatch);

// Delete
router.delete("/:id", isAdmin, deleteMatch);

// Toggle Featured
router.patch("/:id/feature", isAdmin, toggleFeatured);

// Go Live
router.patch("/:id/live", isAdmin, goLive);

// End Live
router.patch("/:id/end", isAdmin, endLive);

module.exports = router;