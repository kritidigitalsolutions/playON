const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");
const controller = require("../../controllers/admobPlacement.controller");

router.get("/", isAuth, controller.getPublicPlacements);

module.exports = router;
