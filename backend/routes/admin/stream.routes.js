const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  createStream,
  getStreams,
  getSingleStream,
  updateStream,
  deleteStream,
  goLive,
  endStream
} = require("../../controllers/admin/stream.controller");

// single thumbnail upload
const streamUpload = upload.single("thumbnail");

// Create
router.post("/", isAdmin, streamUpload, createStream);

// List
router.get("/", isAdmin, getStreams);

// Single
router.get("/:id", isAdmin, getSingleStream);

// Update
router.put("/:id", isAdmin, streamUpload, updateStream);

// Delete
router.delete("/:id", isAdmin, deleteStream);

// Go Live
router.patch("/:id/live", isAdmin, goLive);

// End Stream
router.patch("/:id/end", isAdmin, endStream);

module.exports = router;