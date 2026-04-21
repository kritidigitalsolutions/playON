const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");

const {
  toggleWatchlist,
  getWatchlist,
  removeWatchlist,
  checkWatchlist
} = require("../../controllers/watchlist.controller");

router.post("/toggle", isAuth, toggleWatchlist);
router.get("/", isAuth, getWatchlist);
router.delete("/:id", isAuth, removeWatchlist);
router.get("/check/:itemType/:itemId", isAuth, checkWatchlist);

module.exports = router;