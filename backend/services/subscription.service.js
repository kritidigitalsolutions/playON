const Subscription = require("../models/subscription.model");
const Plan = require("../models/plan.model");

// Buy Subscription
exports.buyPlan = async (userId, planId) => {
  const plan = await Plan.findById(planId);

  if (!plan || !plan.isActive) {
    throw new Error("Plan not available");
  }

  const now = new Date();
  const endDate = new Date(now);

  endDate.setDate(endDate.getDate() + plan.durationDays);

  const subscription = await Subscription.create({
    userId,
    planId,
    startDate: now,
    endDate,
    amountPaid: plan.price,
    status: "active"
  });

  return subscription.populate("planId");
};

// Current Active Subscription
exports.getMySubscription = async (userId) => {
  const now = new Date();

  const subscription = await Subscription.findOne({
    userId,
    status: "active",
    endDate: { $gt: now }
  })
    .populate("planId")
    .sort({ createdAt: -1 });

  return subscription;
};

// History
exports.getHistory = async (userId) => {
  return await Subscription.find({
    userId,
    $or: [
      { isDeleted: false },
      { isDeleted: { $exists: false } }
    ]
  })
    .populate("planId")
    .sort({ createdAt: -1 });
};

// Cancel Subscription
exports.cancelSubscription = async (userId, id) => {
  return await Subscription.findOneAndUpdate(
    {
      _id: id,
      userId
    },
    {
      status: "cancelled"
    },
    {
      new: true
    }
  ).populate("planId");
};

// Check Access
exports.checkAccess = async (userId) => {
  const now = new Date();

  const subscription = await Subscription.findOne({
    userId,
    status: "active",
    endDate: { $gt: now }
  });

  return !!subscription;
};

exports.deleteSubscription = async (userId, id) => {
  return await Subscription.findOneAndUpdate(
    {
      _id: id,
      userId
    },
    {
      isDeleted: true,
      deletedAt: new Date()
    },
    {
      new: true
    }
  );
};

// ===============================
// ADMIN FUNCTIONS
// ===============================

// Admin - Get All Subscriptions
exports.getSubscriptions = async (query) => {
  const {
    status,
    search,
    page = 1,
    limit = 10
  } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  let dataQuery = Subscription.find(filter)
    .populate("userId", "fullName mobile email")
    .populate("planId", "title price billingType")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const subscriptions = await dataQuery;

  // Optional search after populate
  let filtered = subscriptions;

  if (search) {
    const keyword = search.toLowerCase();

    filtered = subscriptions.filter((item) => {
      const user = item.userId || {};
      const plan = item.planId || {};

      return (
        user.fullName?.toLowerCase().includes(keyword) ||
        user.mobile?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        plan.title?.toLowerCase().includes(keyword)
      );
    });
  }

  const total = await Subscription.countDocuments(filter);

  return {
    subscriptions: filtered,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

// Admin - Single Subscription
exports.getSubscriptionById = async (id) => {
  return await Subscription.findById(id)
    .populate("userId", "fullName mobile email")
    .populate("planId", "title price billingType");
};

// Admin - Update Status
exports.updateStatus = async (id, status) => {
  return await Subscription.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  )
    .populate("userId", "fullName mobile email")
    .populate("planId", "title price billingType");
};

// Admin - Hard Delete
exports.adminDeleteSubscription = async (id) => {
  return await Subscription.findByIdAndDelete(id);
};

// Admin - Stats
exports.getSubscriptionStats = async () => {
  const [total, active, cancelled, expired] =
    await Promise.all([
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      Subscription.countDocuments({ status: "cancelled" }),
      Subscription.countDocuments({ status: "expired" })
    ]);

  return {
    total,
    active,
    cancelled,
    expired
  };
};