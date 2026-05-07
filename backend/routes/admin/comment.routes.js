const express = require("express");

const router = express.Router();

const {
  isAdmin
} = require("../../middlewares/admin.middleware");

const {
  getComments,
  deleteComment
} = require("../../controllers/admin/comment.controller");

// GET COMMENTS
router.get(
  "/:itemId",
  isAdmin,
  getComments
);

// ADMIN DELETE COMMENT
router.delete(
  "/:commentId",
  isAdmin,
  deleteComment
);

module.exports = router;