const express = require("express");
const router = express.Router();

const { loginAdmin } = require("../../controllers/admin auth/admin.auth.controller");
const { getAllUsers, deleteUserById } = require("../../controllers/admin/users.admin.controller");
const { isAdmin } = require("../../middlewares/admin.middleware");

router.post("/login", loginAdmin);
router.get("/users", isAdmin, getAllUsers);
router.delete("/users/:id", isAdmin, deleteUserById);

router.get("/dashboard", isAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Welcome Admin Dashboard"
  });
});

module.exports = router;
