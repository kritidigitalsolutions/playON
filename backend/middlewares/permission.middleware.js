exports.hasPermission = (moduleName, action) => {
  return (req, res, next) => {
    try {
      const admin = req.admin;

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      // Super admin bypass
      if (admin.role === "super_admin") {
        return next();
      }

      // 🔥 SAFE CHECK
      const permissions = admin.permissions || {};
      const modulePermissions = permissions[moduleName] || {};

      const allowed = modulePermissions[action];

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: `Access denied: ${moduleName} ${action}`
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