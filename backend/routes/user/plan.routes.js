const express = require("express");
const router = express.Router();

const {
  getPlans,
  getSinglePlan
} = require("../../controllers/plan.controller");

// All active plans
router.get("/", getPlans);

// Single active plan
router.get("/:id", getSinglePlan);

module.exports = router;