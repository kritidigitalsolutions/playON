const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { isSuperAdmin } = require("../../middlewares/superAdmin.middleware");
const {
  createSubAdmin,
  getSubAdmins,
  updateSubAdmin,
  toggleSubAdmin,
  deleteSubAdmin
} = require("../../controllers/admin/subAdmin.controller");

router.post(
  "/",
  isAdmin,
  isSuperAdmin,
  createSubAdmin
);

router.get(
  "/",
  isAdmin,
  isSuperAdmin,
  getSubAdmins
);

router.put(
  "/:id",
  isAdmin,
  isSuperAdmin,
  updateSubAdmin
);

router.patch(
  "/:id/toggle",
  isAdmin,
  isSuperAdmin,
  toggleSubAdmin
);

router.delete(
  "/:id",
  isAdmin,
  isSuperAdmin,
  deleteSubAdmin
);

module.exports = router;
