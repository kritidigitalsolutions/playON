const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");
const {
  addComment,
  getComments
} = require("../../controllers/comment.controller");

// Add comment (protected)
router.post("/", isAuth, addComment);


// Get comments for match/series
router.get("/:itemId", getComments);

module.exports = router;