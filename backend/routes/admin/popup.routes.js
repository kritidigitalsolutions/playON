const express = require("express");
const router = express.Router();

const {
  createPopup,
  getAllPopups,
  getSinglePopup,
  updatePopup,
  deletePopup,
  getPopupPromos,
} = require("../../controllers/admin/popup.controller");

const { isAdmin } = require("../../middlewares/admin.middleware");
const upload = require("../../middlewares/upload.middleware");

// Create Popup
router.post(
  "/",
  isAdmin,
  upload.single("image"),
  createPopup
);

router.get(
  "/promos",
  isAdmin,
  getPopupPromos
);

// Get All Popups
router.get("/", isAdmin, getAllPopups);

// Get Single Popup
router.get("/:id", isAdmin, getSinglePopup);

// Update Popup
router.put(
  "/:id",
  isAdmin,
  upload.single("image"),
  updatePopup
);

// Delete Popup
router.delete("/:id", isAdmin, deletePopup);



module.exports = router;