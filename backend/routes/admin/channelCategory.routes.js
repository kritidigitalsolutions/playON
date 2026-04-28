const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} = require("../../controllers/admin/channelCategory.controller");

router.post("/", isAdmin, createCategory);
router.get("/", isAdmin, getCategories);
router.put("/:id", isAdmin, updateCategory);
router.delete("/:id", isAdmin, deleteCategory);

module.exports = router;