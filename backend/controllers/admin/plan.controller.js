const planService = require("../../services/plan.service");

// helper validation
const validatePlan = (data) => {
  if (!data.planType) {
    return "planType is required";
  }

  if (!data.title || !data.title.trim()) {
    return "title is required";
  }

  if (
    data.price === undefined ||
    Number(data.price) < 0
  ) {
    return "valid price is required";
  }

  if (
    !data.durationDays ||
    Number(data.durationDays) < 1
  ) {
    return "valid durationDays is required";
  }

  return null;
};

// Create
exports.createPlan = async (req, res) => {
  try {
    const data = { ...req.body };

    const errorMessage = validatePlan(data);

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    const plan = await planService.createPlan(data);

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// List
exports.getPlans = async (req, res) => {
  try {
    const result = await planService.getPlans(req.query);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Single
exports.getSinglePlan = async (req, res) => {
  try {
    const plan = await planService.getPlanById(req.params.id);

    if (!plan) {
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

// Update
exports.updatePlan = async (req, res) => {
  try {
    const updatedData = { ...req.body };

    const errorMessage = validatePlan(updatedData);

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    const plan = await planService.updatePlan(
      req.params.id,
      updatedData
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    res.json({
      success: true,
      message: "Plan updated successfully",
      plan
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete
exports.deletePlan = async (req, res) => {
  try {
    const plan = await planService.deletePlan(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    res.json({
      success: true,
      message: "Plan deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle Status
exports.toggleStatus = async (req, res) => {
  try {
    const plan = await planService.toggleStatus(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      plan
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Sort Order
exports.updateSortOrder = async (req, res) => {
  try {
    const { sortOrder } = req.body;

    const plan = await planService.updateSortOrder(
      req.params.id,
      sortOrder
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    res.json({
      success: true,
      message: "Sort order updated successfully",
      plan
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};