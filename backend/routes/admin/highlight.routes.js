const express = require("express");

const router = express.Router();

const {
  isAdmin
} = require("../../middlewares/admin.middleware");

const {
  hasPermission
} = require("../../middlewares/permission.middleware");

const highlightUpload = require("../../middlewares/highlightUpload.middleware");

const {
  createHighlight,
  getHighlights,
  getSingleHighlight,
  updateHighlight,
  deleteHighlight
} = require("../../controllers/admin/highlight.controller");

// Upload fields
const hlFields = highlightUpload.fields([
  {
    name: "thumbnail",
    maxCount: 1
  },

  {
    name: "videoFile",
    maxCount: 1
  }
]);

// CREATE HIGHLIGHT
router.post(
  "/",

  isAdmin,

  hasPermission(
    "matchHighlights",
    "create"
  ),

  hlFields,

  createHighlight
);

// GET ALL HIGHLIGHTS
router.get(
  "/",

  isAdmin,

  hasPermission(
    "matchHighlights",
    "view"
  ),

  getHighlights
);

// GET SINGLE HIGHLIGHT
router.get(
  "/:id",

  isAdmin,

  hasPermission(
    "matchHighlights",
    "view"
  ),

  getSingleHighlight
);

// UPDATE HIGHLIGHT
router.patch(
  "/:id",

  isAdmin,

  hasPermission(
    "matchHighlights",
    "edit"
  ),

  hlFields,

  updateHighlight
);

// DELETE HIGHLIGHT
router.delete(
  "/:id",

  isAdmin,

  hasPermission(
    "matchHighlights",
    "delete"
  ),

  deleteHighlight
);

module.exports = router;