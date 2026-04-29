const express = require("express");
const router = express.Router();

const {
  getCategories
} = require("../../controllers/channelCategory.controller");

router.get("/", getCategories);

module.exports = router;