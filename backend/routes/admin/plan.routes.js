const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");

const {
  createPlan,
  getPlans,
  getSinglePlan,
  updatePlan,
  deletePlan,
  toggleStatus,
  updateSortOrder
} = require("../../controllers/admin/plan.controller");

// Create
router.post(
  "/",
  isAdmin,
  hasPermission("plans", "create"),
  createPlan
);

// List
router.get(
  "/",
  isAdmin,
  hasPermission("plans", "view"),
  getPlans
);

// Single
router.get(
  "/:id",
  isAdmin,
  hasPermission("plans", "view"),
  getSinglePlan
);

// Update
router.put(
  "/:id",
  isAdmin,
  hasPermission("plans", "edit"),
  updatePlan
);

// Delete
router.delete(
  "/:id",
  isAdmin,
  hasPermission("plans", "delete"),
  deletePlan
);

// Toggle Status
router.patch(
  "/:id/toggle-status",
  isAdmin,
  hasPermission("plans", "edit"),
  toggleStatus
);

// Sort Order
router.patch(
  "/:id/sort",
  isAdmin,
  hasPermission("plans", "edit"),
  updateSortOrder
);

module.exports = router;