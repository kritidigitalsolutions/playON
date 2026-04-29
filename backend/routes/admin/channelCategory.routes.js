const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} = require("../../controllers/admin/channelCategory.controller");

// Create
router.post(
  "/",
  isAdmin,
  hasPermission("channels", "create"),
  createCategory
);

// List
router.get(
  "/",
  isAdmin,
  hasPermission("channels", "view"),
  getCategories
);

// Update
router.put(
  "/:id",
  isAdmin,
  hasPermission("channels", "edit"),
  updateCategory
);

// Delete
router.delete(
  "/:id",
  isAdmin,
  hasPermission("channels", "delete"),
  deleteCategory
);

module.exports = router;