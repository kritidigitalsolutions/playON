const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");

const {
  createPromo,
  getPromos,
  getSinglePromo,
  updatePromo,
  deletePromo,
  togglePromoStatus
} = require("../../controllers/admin/promoCode.controller");

router.post("/", isAdmin, createPromo);
router.get("/", isAdmin, getPromos);
router.get("/:id", isAdmin, getSinglePromo);
router.patch("/:id", isAdmin, updatePromo);
router.delete("/:id", isAdmin, deletePromo);
router.patch("/:id/toggle", isAdmin, togglePromoStatus);

module.exports = router;