const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");

const {
  upsertPage,
  getPages,
  getSinglePage,
  toggleStatus,
  deletePage
} = require("../../controllers/admin/legal.controller");

// All Pages
router.get(
  "/",
  isAdmin,
  hasPermission("admins", "view"),
  getPages
);

// Single Page
router.get(
  "/:type",
  isAdmin,
  hasPermission("admins", "view"),
  getSinglePage
);

// Create / Update
router.post(
  "/:type",
  isAdmin,
  hasPermission("admins", "edit"),
  upsertPage
);

// Toggle Active / Inactive
router.patch(
  "/:type/toggle-status",
  isAdmin,
  hasPermission("admins", "edit"),
  toggleStatus
);

// Delete
router.delete(
  "/:type",
  isAdmin,
  hasPermission("admins", "delete"),
  deletePage
);

module.exports = router;