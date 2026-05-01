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
  hasPermission("legal", "view"),
  getPages
);

// Single Page
router.get(
  "/:type",
  isAdmin,
  hasPermission("legal", "view"),
  getSinglePage
);

// Create / Update
router.post(
  "/:type",
  isAdmin,
  hasPermission("legal", "edit"),
  upsertPage
);

// Toggle Active / Inactive
router.patch(
  "/:type/toggle-status",
  isAdmin,
  hasPermission("legal", "edit"),
  toggleStatus
);

// Delete
router.delete(
  "/:type",
  isAdmin,
  hasPermission("legal", "delete"),
  deletePage
);

module.exports = router;