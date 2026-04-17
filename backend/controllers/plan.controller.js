const planService = require("../services/plan.service");

// Get Active Plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await planService.getActivePlans();

    res.json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Single Active Plan
exports.getSinglePlan = async (req, res) => {
  try {
    const plan = await planService.getPlanById(req.params.id);

    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    res.json({
      success: true,
      plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};