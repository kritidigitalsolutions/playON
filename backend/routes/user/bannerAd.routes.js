const express = require("express");
const router = express.Router();

const controller = require("../../controllers/bannerAd.controller");
// const {isAuth}= require("../../middlewares/auth.middleware");

router.get("/", controller.getPublicBanners);
router.post("/:id/click", controller.incrementClick);

module.exports = router;