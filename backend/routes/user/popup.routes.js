const express = require("express");
const router = express.Router();

const { getActivePopup } = require("../../controllers/popup.controller");

// Get Active Popup
router.get("/", getActivePopup);

module.exports = router;