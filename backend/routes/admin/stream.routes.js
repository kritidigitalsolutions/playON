const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  createStream,
  getStreams,
  getSingleStream,
  updateStream,
  deleteStream,
  goLive,
  endStream,
  watchStream
} = require("../../controllers/admin/stream.controller");

// single thumbnail upload
const streamUpload = upload.single("thumbnail");

// Create
router.post(
  "/",
  isAdmin,
  hasPermission("streams", "create"),
  streamUpload,
  createStream
);

// List
router.get(
  "/",
  isAdmin,
  hasPermission("streams", "view"),
  getStreams
);

// Single
router.get(
  "/:id",
  isAdmin,
  hasPermission("streams", "view"),
  getSingleStream
);

// Update
router.put(
  "/:id",
  isAdmin,
  hasPermission("streams", "edit"),
  streamUpload,
  updateStream
);

// Delete
router.delete(
  "/:id",
  isAdmin,
  hasPermission("streams", "delete"),
  deleteStream
);

// Go Live
router.patch(
  "/:id/live",
  isAdmin,
  hasPermission("streams", "edit"),
  goLive
);

// End Stream
router.patch(
  "/:id/end",
  isAdmin,
  hasPermission("streams", "edit"),
  endStream
);

router.get(
  "/:id/watch",
  isAdmin,
  hasPermission("streams", "view"),
  watchStream
);

module.exports = router;