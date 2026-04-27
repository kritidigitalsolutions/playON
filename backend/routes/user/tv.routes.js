const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");

const {
  generateCode,
  loginWithCode
} = require("../../controllers/tv.controller");

router.post("/generate-code", isAuth, generateCode);

// TV submits code
router.post("/login", loginWithCode);

module.exports = router;