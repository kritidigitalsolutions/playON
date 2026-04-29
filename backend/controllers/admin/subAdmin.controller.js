const Admin = require("../../models/admin.model");
const bcrypt = require("bcryptjs");

// Create Sub Admin
exports.createSubAdmin = async (req, res) => {
  try {
    const { name, email, password, permissions } =
      req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const exists = await Admin.findOne({
      email: normalizedEmail
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: exists.role === "super_admin"
          ? "Super admin email cannot be used for a sub admin"
          : "Email already exists"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "sub_admin",
      permissions,
      isActive: true
    });

    const safeAdmin = admin.toObject();
    delete safeAdmin.password;

    res.status(201).json({
      success: true,
      message: "Sub admin created",
      admin: safeAdmin
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// List Sub Admins
exports.getSubAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({
      role: "sub_admin"
    }).select("-password");

    res.json({
      success: true,
      count: admins.length,
      admins
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Permissions
exports.updateSubAdmin = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    const admin =
      await Admin.findOneAndUpdate(
        {
          _id: req.params.id,
          role: "sub_admin"
        },
        { name, permissions },
        { new: true }
      ).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Sub admin not found"
      });
    }

    res.json({
      success: true,
      message: "Updated successfully",
      admin
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle Active
exports.toggleSubAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      _id: req.params.id,
      role: "sub_admin"
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Sub admin not found"
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    const safeAdmin = admin.toObject();
    delete safeAdmin.password;

    res.json({
      success: true,
      message: "Status updated",
      admin: safeAdmin
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Sub Admin
exports.deleteSubAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOneAndDelete({
      _id: req.params.id,
      role: "sub_admin"
    }).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Sub admin not found"
      });
    }

    res.json({
      success: true,
      message: "Sub admin deleted",
      admin
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
