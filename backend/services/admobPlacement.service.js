const AdmobPlacement = require("../models/admobPlacement.model");

exports.createPlacement = async (data) => {
  return await AdmobPlacement.create(data);
};

exports.getPlacements = async () => {
  return await AdmobPlacement.find().sort({
    sortOrder: 1,
    createdAt: -1
  });
};

exports.getPublicPlacements = async (position) => {
  const filter = { isActive: true };

  if (position) {
    filter.position = position;
  }

  return await AdmobPlacement.find(filter).sort({
    sortOrder: 1,
    createdAt: -1
  });
};

exports.updatePlacement = async (id, data) => {
  return await AdmobPlacement.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
};

exports.togglePlacement = async (id) => {
  const placement = await AdmobPlacement.findById(id);
  if (!placement) return null;

  placement.isActive = !placement.isActive;
  await placement.save();

  return placement;
};

exports.deletePlacement = async (id) => {
  return await AdmobPlacement.findByIdAndDelete(id);
};
