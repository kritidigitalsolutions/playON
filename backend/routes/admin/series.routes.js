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

// Create
router.post(
  "/",
  isAdmin,
  hasPermission("matches", "create"),
  upload.single("banner"),
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
  upload.single("banner"),
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