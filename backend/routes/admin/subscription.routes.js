const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");

const {
  getSubscriptions,
  getSingleSubscription,
  updateStatus,
  cancelSubscription,
  deleteSubscription,
  getStats
} = require("../../controllers/admin/subscription.controller");

// IMPORTANT: specific routes first

// Dashboard stats
router.get("/stats/overview", isAdmin, getStats);

// All subscriptions
router.get("/", isAdmin, getSubscriptions);

// Single subscription
router.get("/:id", isAdmin, getSingleSubscription);

// Update status manually
router.patch("/:id/status", isAdmin, updateStatus);

// Cancel subscription
router.patch("/:id/cancel", isAdmin, cancelSubscription);

// Delete subscription
router.delete("/:id", isAdmin, deleteSubscription);

module.exports = router;