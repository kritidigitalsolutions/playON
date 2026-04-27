const express = require("express");
const router = express.Router();

const sportController = require("../../controllers/sport.controller");

router.get("/", sportController.getPublicSports);

module.exports = router;