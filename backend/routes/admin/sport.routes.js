const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");

const sportController = require("../../controllers/sport.controller");

// Create
router.post(
  "/",
  isAdmin,
  hasPermission("matches", "create"),
  sportController.createSport
);

// List
router.get(
  "/",
  isAdmin,
  hasPermission("matches", "view"),
  sportController.getSports
);

// Update
router.put(
  "/:id",
  isAdmin,
  hasPermission("matches", "edit"),
  sportController.updateSport
);

// Toggle Status
router.patch(
  "/:id/toggle-status",
  isAdmin,
  hasPermission("matches", "edit"),
  sportController.toggleStatus
);

// Delete
router.delete(
  "/:id",
  isAdmin,
  hasPermission("matches", "delete"),
  sportController.deleteSport
);

module.exports = router;