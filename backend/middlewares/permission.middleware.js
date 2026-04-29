exports.hasPermission = (
  moduleName,
  action
) => {
  return (req, res, next) => {
    try {
      const admin = req.admin;

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      // Full access
      if (admin.role === "super_admin") {
        return next();
      }

      const allowed =
        admin.permissions?.[moduleName]?.[action];

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
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
};