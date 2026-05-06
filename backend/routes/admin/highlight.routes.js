const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
const highlightUpload = require("../../middlewares/highlightUpload.middleware");

const {
  createHighlight,
  getHighlights,
  getSingleHighlight,
  updateHighlight,
  deleteHighlight
} = require("../../controllers/admin/highlight.controller");

const hlFields = highlightUpload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "videoFile", maxCount: 1 }
]);

router.post("/", isAdmin, hasPermission("matches", "create"), hlFields, createHighlight);
router.get("/", isAdmin, hasPermission("matches", "view"), getHighlights);
router.get("/:id", isAdmin, hasPermission("matches", "view"), getSingleHighlight);
router.patch("/:id", isAdmin, hasPermission("matches", "edit"), hlFields, updateHighlight);
router.delete("/:id", isAdmin, hasPermission("matches", "delete"), deleteHighlight);

module.exports = router;
