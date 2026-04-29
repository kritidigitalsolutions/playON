const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");

const {
  getSubscriptions,
  getSingleSubscription,
  updateStatus,
  cancelSubscription,
  deleteSubscription,
  getStats
} = require("../../controllers/admin/subscription.controller");

// Dashboard stats
router.get(
  "/stats/overview",
  isAdmin,
  hasPermission("plans", "view"),
  getStats
);

// All subscriptions
router.get(
  "/",
  isAdmin,
  hasPermission("plans", "view"),
  getSubscriptions
);

// Single subscription
router.get(
  "/:id",
  isAdmin,
  hasPermission("plans", "view"),
  getSingleSubscription
);

// Update status manually
router.patch(
  "/:id/status",
  isAdmin,
  hasPermission("plans", "edit"),
  updateStatus
);

// Cancel subscription
router.patch(
  "/:id/cancel",
  isAdmin,
  hasPermission("plans", "edit"),
  cancelSubscription
);

// Delete subscription
router.delete(
  "/:id",
  isAdmin,
  hasPermission("plans", "delete"),
  deleteSubscription
);

module.exports = router;