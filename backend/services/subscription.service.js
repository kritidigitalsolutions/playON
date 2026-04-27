const Subscription = require("../models/subscription.model");
const Plan = require("../models/plan.model");

// Buy Subscription (fallback/manual)
exports.buyPlan = async (userId, planId) => {
  const plan = await Plan.findById(planId);

  if (!plan || !plan.isActive) {
    throw new Error("Plan not available");
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(
    endDate.getDate() + plan.durationDays
  );

  const subscription =
    await Subscription.create({
      userId,
      planId,
      accessType: plan.planType,
      teamId: plan.teamId || null,
      matchId: plan.matchId || null,
      seriesId: plan.seriesId || null,
      startDate: now,
      endDate,
      amountPaid: plan.price,
      status: "active"
    });

  return subscription.populate([
    { path: "planId" },
    { path: "teamId", select: "name logo shortName" },
    { path: "matchId", select: "title" },
    { path: "seriesId", select: "title" }
  ]);
};

// Current Active
exports.getMySubscription = async (userId) => {
  const now = new Date();

  return await Subscription.find({
    userId,
    status: "active",
    endDate: { $gt: now },
    isDeleted: { $ne: true }
  })
    .populate("planId")
    .populate("teamId", "name logo shortName")
    .populate("matchId", "title")
    .populate("seriesId", "title")
    .sort({ createdAt: -1 });
};

// History
exports.getHistory = async (userId) => {
  return await Subscription.find({
    userId,
    isDeleted: { $ne: true }
  })
    .populate("planId")
    .populate("teamId", "name logo shortName")
    .populate("matchId", "title")
    .populate("seriesId", "title")
    .sort({ createdAt: -1 });
};

// Cancel
exports.cancelSubscription = async (
  userId,
  id
) => {
  return await Subscription.findOneAndUpdate(
    { _id: id, userId },
    { status: "cancelled" },
    { new: true }
  ).populate("planId");
};

// Generic Access Check
exports.checkAccess = async (userId) => {
  const now = new Date();

  const subscription =
    await Subscription.findOne({
      userId,
      status: "active",
      endDate: { $gt: now },
      isDeleted: { $ne: true }
    });

  return !!subscription;
};

// Detailed Content Access Check
exports.checkMatchAccess = async (
  userId,
  match
) => {
  const now = new Date();

  const subscriptions =
    await Subscription.find({
      userId,
      status: "active",
      endDate: { $gt: now },
      isDeleted: { $ne: true }
    });

  for (const sub of subscriptions) {
    // Global access
    if (
      sub.accessType === "monthly_pass" ||
      sub.accessType === "yearly_pass"
    ) {
      return true;
    }

    // Exact match
    if (
      sub.accessType === "match_pass" &&
      sub.matchId?.toString() ===
        match._id.toString()
    ) {
      return true;
    }

    // Series
    if (
      sub.accessType === "series_pass" &&
      sub.seriesId &&
      match.seriesId &&
      sub.seriesId.toString() ===
        match.seriesId.toString()
    ) {
      return true;
    }

    // Team
    if (
      sub.accessType === "team_pass" &&
      sub.teamId &&
      (
        sub.teamId.toString() ===
          match.teamAId?.toString() ||
        sub.teamId.toString() ===
          match.teamBId?.toString()
      )
    ) {
      return true;
    }
  }

  return false;
};

// Soft Delete
exports.deleteSubscription = async (
  userId,
  id
) => {
  return await Subscription.findOneAndUpdate(
    { _id: id, userId },
    {
      isDeleted: true,
      deletedAt: new Date()
    },
    { new: true }
  );
};

// ===================
// ADMIN
// ===================

// Get All
exports.getSubscriptions = async (
  query
) => {
  const {
    status,
    page = 1,
    limit = 10
  } = query;

  const filter = {};
  if (status) filter.status = status;

  const skip =
    (Number(page) - 1) * Number(limit);

  const [subscriptions, total] =
    await Promise.all([
      Subscription.find(filter)
        .populate(
          "userId",
          "fullName mobile email"
        )
        .populate(
          "planId",
          "title price planType"
        )
        .populate(
          "teamId",
          "name shortName"
        )
        .populate(
          "matchId",
          "title"
        )
        .populate(
          "seriesId",
          "title"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Subscription.countDocuments(filter)
    ]);

  return {
    subscriptions,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(
        total / Number(limit)
      )
    }
  };
};

// Single
exports.getSubscriptionById =
async (id) => {
  return await Subscription.findById(id)
    .populate(
      "userId",
      "fullName mobile email"
    )
    .populate(
      "planId",
      "title price planType"
    )
    .populate(
      "teamId",
      "name shortName"
    )
    .populate("matchId", "title")
    .populate("seriesId", "title");
};

// Update Status
exports.updateStatus = async (
  id,
  status
) => {
  return await Subscription.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
};

// Hard Delete
exports.adminDeleteSubscription =
async (id) => {
  return await Subscription.findByIdAndDelete(
    id
  );
};

// Stats
exports.getSubscriptionStats =
async () => {
  const [
    total,
    active,
    cancelled,
    expired
  ] = await Promise.all([
    Subscription.countDocuments(),
    Subscription.countDocuments({
      status: "active"
    }),
    Subscription.countDocuments({
      status: "cancelled"
    }),
    Subscription.countDocuments({
      status: "expired"
    })
  ]);

  return {
    total,
    active,
    cancelled,
    expired
  };
};