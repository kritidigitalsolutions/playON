const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  createSeries,
  getAllSeries,
  getSingleSeries,
  updateSeries,
  deleteSeries
} = require("../../controllers/admin/series.controller");

const seriesUploads = upload.fields([
  { name: "banner", maxCount: 1 },
  { name: "tournamentLogo", maxCount: 1 }
]);

// Create
router.post(
  "/",
  isAdmin,
  hasPermission("matches", "create"),
  seriesUploads,
  createSeries
);

// List
router.get(
  "/",
  isAdmin,
  hasPermission("matches", "view"),
  getAllSeries
);

// Single
router.get(
  "/:id",
  isAdmin,
  hasPermission("matches", "view"),
  getSingleSeries
);

// Update
router.patch(
  "/:id",
  isAdmin,
  hasPermission("matches", "edit"),
  seriesUploads,
  updateSeries
);

// Delete
router.delete(
  "/:id",
  isAdmin,
  hasPermission("matches", "delete"),
  deleteSeries
);

module.exports = router;
