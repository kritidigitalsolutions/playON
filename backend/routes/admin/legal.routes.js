const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");

const {
  upsertPage,
  getPages,
  getSinglePage,
  toggleStatus,
  deletePage
} = require("../../controllers/admin/legal.controller");

// All Pages
router.get("/", isAdmin, getPages);

// Single Page
router.get("/:type", isAdmin, getSinglePage);

// Create / Update
router.post("/:type", isAdmin, upsertPage);

// Toggle Active / Inactive
router.patch("/:type/toggle-status", isAdmin, toggleStatus);

// Delete
router.delete("/:type", isAdmin, deletePage);

module.exports = router;