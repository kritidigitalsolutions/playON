const Subscription = require("../models/subscription.model");

exports.hasSubscription = async (req, res, next) => {
  try {
    const now = new Date();

    const subscription = await Subscription.findOne({
      userId: req.user.userId,
      status: "active",
      endDate: { $gt: now },
      isDeleted: { $ne: true }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required",
        locked: true
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};