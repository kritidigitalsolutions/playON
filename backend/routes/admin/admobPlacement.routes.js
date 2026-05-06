const express = require("express");
const router = express.Router();

const { isAdmin } = require("../../middlewares/admin.middleware");
const { hasPermission } = require("../../middlewares/permission.middleware");
const controller = require("../../controllers/admobPlacement.controller");

router.post(
  "/",
  isAdmin,
  hasPermission("admobPlacements", "create"),
  controller.createPlacement
);

router.get(
  "/",
  isAdmin,
  hasPermission("admobPlacements", "view"),
  controller.getPlacements
);

router.patch(
  "/:id/toggle",
  isAdmin,
  hasPermission("admobPlacements", "edit"),
  controller.togglePlacement
);

router.put(
  "/:id",
  isAdmin,
  hasPermission("admobPlacements", "edit"),
  controller.updatePlacement
);

router.delete(
  "/:id",
  isAdmin,
  hasPermission("admobPlacements", "delete"),
  controller.deletePlacement
);

module.exports = router;
