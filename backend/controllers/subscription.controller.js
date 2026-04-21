const subscriptionService = require("../services/subscription.service");

// Buy Plan
// exports.buyPlan = async (req, res) => {
//   try {
//     const { planId } = req.body;

//     if (!planId) {
//       return res.status(400).json({
//         success: false,
//         message: "planId is required"
//       });
//     }

//     const subscription =
//       await subscriptionService.buyPlan(
//         req.user.userId,
//         planId
//       );

//     res.status(201).json({
//       success: true,
//       message: "Plan purchased successfully",
//       subscription
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// My Current Subscription
exports.getMySubscription = async (req, res) => {
  try {
    const subscription =
      await subscriptionService.getMySubscription(
        req.user.userId
      );

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// History
exports.getHistory = async (req, res) => {
  try {
    const history =
      await subscriptionService.getHistory(
        req.user.userId
      );

    res.json({
      success: true,
      count: history.length,
      subscriptions: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cancel
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription =
      await subscriptionService.cancelSubscription(
        req.user.userId,
        req.params.id
      );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check Access
exports.checkAccess = async (req, res) => {
  try {
    const hasAccess =
      await subscriptionService.checkAccess(
        req.user.userId
      );

    res.json({
      success: true,
      hasAccess
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    const subscription =
      await subscriptionService.deleteSubscription(
        req.user.userId,
        req.params.id
      );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    res.json({
      success: true,
      message: "Subscription removed from history"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};