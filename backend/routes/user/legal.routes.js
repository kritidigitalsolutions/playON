const express = require("express");
const router = express.Router();

const { getPage } = require("../../controllers/legal.controller");

// Public page by type
router.get("/:type", getPage);

module.exports = router;