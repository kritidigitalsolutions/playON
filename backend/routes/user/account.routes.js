const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");
const {
  deleteMyAccount
} = require("../../controllers/account.controller");

router.delete("/delete-account", isAuth, deleteMyAccount);

module.exports = router;