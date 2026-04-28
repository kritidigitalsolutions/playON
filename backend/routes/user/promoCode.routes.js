const express = require("express");
const router = express.Router();

const {
  getAvailablePromos
} = require("../../controllers/promoCode.controller");

router.get("/", getAvailablePromos);

module.exports = router;