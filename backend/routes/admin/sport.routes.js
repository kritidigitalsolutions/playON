const express = require("express");
const router = express.Router();

const {isAdmin} = require("../../middlewares/admin.middleware");
const sportController = require("../../controllers/sport.controller");

router.post("/", isAdmin, sportController.createSport);
router.get("/", isAdmin, sportController.getSports);
router.put("/:id", isAdmin, sportController.updateSport);
router.patch("/:id/toggle-status", isAdmin, sportController.toggleStatus);
router.delete("/:id", isAdmin, sportController.deleteSport);

module.exports = router;