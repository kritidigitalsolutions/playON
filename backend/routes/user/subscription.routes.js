const express = require("express");
const router = express.Router();

const { isAuth } = require("../../middlewares/auth.middleware");

const {
  buyPlan,
  getMySubscription,
  getHistory,
  cancelSubscription,
  checkAccess,
    deleteSubscription
} = require("../../controllers/subscription.controller");

// Buy Plan
// router.post("/buy", isAuth, buyPlan);

// Current Subscription
router.get("/my", isAuth, getMySubscription);

// History
router.get("/history", isAuth, getHistory);

// Cancel Subscription
router.patch("/cancel/:id", isAuth, cancelSubscription);

// Check Premium Access
router.get("/check-access", isAuth, checkAccess);

// Delete Subscription
router.delete("/delete/:id", isAuth, deleteSubscription);

module.exports = router;