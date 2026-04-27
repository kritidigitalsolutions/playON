const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");

const {
  createTeam,
  getTeams,
  getSingleTeam,
  updateTeam,
  deleteTeam,
  toggleStatus
} = require("../../controllers/admin/team.controller");

router.post("/", isAdmin, createTeam);
router.get("/", isAdmin, getTeams);
router.get("/:id", isAdmin, getSingleTeam);
router.put("/:id", isAdmin, updateTeam);
router.delete("/:id", isAdmin, deleteTeam);
router.patch("/:id/toggle-status", isAdmin, toggleStatus);

module.exports = router;