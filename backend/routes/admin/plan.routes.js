const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");

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
router.post("/", isAdmin, createPlan);

// List
router.get("/", isAdmin, getPlans);

// Single
router.get("/:id", isAdmin, getSinglePlan);

// Update
router.put("/:id", isAdmin, updatePlan);

// Delete
router.delete("/:id", isAdmin, deletePlan);

// Toggle Status
router.patch("/:id/toggle-status", isAdmin, toggleStatus);

// Sort Order
router.patch("/:id/sort", isAdmin, updateSortOrder);

module.exports = router;