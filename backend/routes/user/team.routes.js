const express = require("express");
const router = express.Router();

const {
  getTeams,
  getSingleTeam
} = require("../../controllers/team.controller");

router.get("/", getTeams);
router.get("/:id", getSingleTeam);

module.exports = router;