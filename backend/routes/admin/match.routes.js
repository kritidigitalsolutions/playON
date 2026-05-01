const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  createMatch,
  getAllMatches,
  getSingleMatch,
  updateMatch,
  deleteMatch,
  toggleFeatured,
  goLive,
  endLive,
  watchMatch
} = require("../../controllers/admin/match.controller");

const matchUploads = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: "teamALogo", maxCount: 1 },
  { name: "teamBLogo", maxCount: 1 }
]);

router.post(
  "/create",
  isAdmin,
  hasPermission("matches", "create"),
  matchUploads,
  createMatch
);

router.get(
  "/",
  isAdmin,
  hasPermission("matches", "view"),
  getAllMatches
);

router.get(
  "/:id",
  isAdmin,
  hasPermission("matches", "view"),
  getSingleMatch
);

router.patch(
  "/:id",
  isAdmin,
  hasPermission("matches", "edit"),
  matchUploads,
  updateMatch
);

router.delete(
  "/:id",
  isAdmin,
  hasPermission("matches", "delete"),
  deleteMatch
);

router.patch(
  "/:id/feature",
  isAdmin,
  hasPermission("matches", "edit"),
  toggleFeatured
);

router.patch(
  "/:id/live",
  isAdmin,
  hasPermission("matches", "edit"),
  goLive
);

router.patch(
  "/:id/end",
  isAdmin,
  hasPermission("matches", "edit"),
  endLive
);

router.get(
  "/:id/watch",
  isAdmin,
  hasPermission("matches", "view"),
  watchMatch
);

module.exports = router;