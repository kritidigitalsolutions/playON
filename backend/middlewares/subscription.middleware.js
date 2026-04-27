const subscriptionService = require("../services/subscription.service");
const Match = require("../models/match.model");

// Generic Premium Check
exports.hasSubscription = async (
  req,
  res,
  next
) => {
  try {
    const hasAccess =
      await subscriptionService.checkAccess(
        req.user.userId
      );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Active subscription required",
        locked: true
      });
    }

    next();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Match Specific Access
exports.hasMatchAccess = async (
  req,
  res,
  next
) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(
      matchId
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    const allowed =
      await subscriptionService.checkMatchAccess(
        req.user.userId,
        match
      );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "This content is locked",
        locked: true
      });
    }

    req.match = match;
    next();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};