const Plan = require("../models/plan.model");

// Create
exports.createPlan = async (data) => {
  return await Plan.create(data);
};

// List (Admin)
exports.getPlans = async (query) => {
  const {
    search,
    isActive,
    page = 1,
    limit = 10
  } = query;

  const filter = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { billingType: { $regex: search, $options: "i" } }
    ];
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [plans, total] = await Promise.all([
    Plan.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Plan.countDocuments(filter)
  ]);

  return {
    plans,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

// Single
exports.getPlanById = async (id) => {
  return await Plan.findById(id);
};

// Update
exports.updatePlan = async (id, data) => {
  return await Plan.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true
    }
  );
};

// Delete
exports.deletePlan = async (id) => {
  return await Plan.findByIdAndDelete(id);
};

// Toggle Status
exports.toggleStatus = async (id) => {
  const plan = await Plan.findById(id);

  if (!plan) return null;

  plan.isActive = !plan.isActive;
  await plan.save();

  return plan;
};

// Sort Order
exports.updateSortOrder = async (id, sortOrder) => {
  return await Plan.findByIdAndUpdate(
    id,
    { sortOrder },
    { new: true }
  );
};

// User Public Plans
exports.getActivePlans = async () => {
  return await Plan.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 });
};