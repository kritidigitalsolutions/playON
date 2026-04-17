const subscriptionService = require("../../services/subscription.service");

// Get All
exports.getSubscriptions = async (req, res) => {
  try {
    const result =
      await subscriptionService.getSubscriptions(req.query);

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

// Get Single
exports.getSingleSubscription = async (req, res) => {
  try {
    const subscription =
      await subscriptionService.getSubscriptionById(
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
      subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const subscription =
      await subscriptionService.updateStatus(
        req.params.id,
        status
      );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      subscription
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
      await subscriptionService.updateStatus(
        req.params.id,
        "cancelled"
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

// Delete
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription =
      await subscriptionService.adminDeleteSubscription(
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
      message: "Subscription deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Stats
exports.getStats = async (req, res) => {
  try {
    const stats =
      await subscriptionService.getSubscriptionStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};