const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");

exports.isAdmin = async (req, res, next) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      !["super_admin", "sub_admin"].includes(
        decoded.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const admin = await Admin.findById(
      decoded.adminId
    ).select("-password");

    if (!admin || admin.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account disabled"
      });
    }

    req.admin = admin;

    next();

  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};