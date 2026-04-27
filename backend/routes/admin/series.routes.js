const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const upload = require("../../middlewares/upload.middleware");

const {
  createSeries,
  getAllSeries,
  getSingleSeries,
  updateSeries,
  deleteSeries
} = require("../../controllers/admin/series.controller");

router.post("/", isAdmin, upload.single("banner"), createSeries);
router.get("/", isAdmin, getAllSeries);
router.get("/:id", isAdmin, getSingleSeries);
router.patch("/:id", isAdmin, upload.single("banner"), updateSeries);
router.delete("/:id", isAdmin, deleteSeries);

module.exports = router;