exports.isSuperAdmin = (
  req,
  res,
  next
) => {
  try {
    if (
      !req.admin ||
      req.admin.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Super admin only"
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