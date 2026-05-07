const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  createTeam,
  getTeams,
  getSingleTeam,
  updateTeam,
  deleteTeam,
  toggleStatus
} = require("../../controllers/admin/team.controller");

// Create
router.post(
  "/",
  isAdmin,
  hasPermission("matches", "create"),
  upload.single("logoFile"),
  createTeam
);

// List
router.get(
  "/",
  isAdmin,
  hasPermission("matches", "view"),
  getTeams
);

// Single
router.get(
  "/:id",
  isAdmin,
  hasPermission("matches", "view"),
  getSingleTeam
);

// Update
router.put(
  "/:id",
  isAdmin,
  hasPermission("matches", "edit"),
  upload.single("logoFile"),
  updateTeam
);

// Delete
router.delete(
  "/:id",
  isAdmin,
  hasPermission("matches", "delete"),
  deleteTeam
);

// Toggle Status
router.patch(
  "/:id/toggle-status",
  isAdmin,
  hasPermission("matches", "edit"),
  toggleStatus
);

module.exports = router;