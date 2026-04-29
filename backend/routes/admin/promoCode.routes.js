const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");

const {
  createPromo,
  getPromos,
  getSinglePromo,
  updatePromo,
  deletePromo,
  togglePromoStatus
} = require("../../controllers/admin/promoCode.controller");

// Create
router.post(
  "/",
  isAdmin,
  hasPermission("promos", "create"),
  createPromo
);

// List
router.get(
  "/",
  isAdmin,
  hasPermission("promos", "view"),
  getPromos
);

// Single
router.get(
  "/:id",
  isAdmin,
  hasPermission("promos", "view"),
  getSinglePromo
);

// Update
router.patch(
  "/:id",
  isAdmin,
  hasPermission("promos", "edit"),
  updatePromo
);

// Delete
router.delete(
  "/:id",
  isAdmin,
  hasPermission("promos", "delete"),
  deletePromo
);

// Toggle Status
router.patch(
  "/:id/toggle",
  isAdmin,
  hasPermission("promos", "edit"),
  togglePromoStatus
);

module.exports = router;