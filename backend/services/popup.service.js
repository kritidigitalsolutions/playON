const Popup = require("../models/popup.model");

// Create
exports.createPopup = async (data) => {
  return await Popup.create(data);
};

// Get All
exports.getAllPopups = async (query = {}) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.max(parseInt(query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.type) {
    filter.type = query.type.toUpperCase();
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  if (query.search) {
    filter.title = {
      $regex: query.search,
      $options: "i",
    };
  }

  const [popups, total] = await Promise.all([
    Popup.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("promo.promoId")
      .lean(),

    Popup.countDocuments(filter),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    popups,
  };
};

// Get By Id
exports.getPopupById = async (id) => {
  return await Popup.findById(id)
    .populate("promo.promoId");
};

// Update
exports.updatePopup = async (id, data) => {
  return await Popup.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("promo.promoId");
};

// Delete
exports.deletePopup = async (id) => {
  return await Popup.findByIdAndDelete(id);
};

// Get Active Popup (User)
exports.getActivePopup = async () => {
  const now = new Date();

  return await Popup.findOne({
    isActive: true,
    $or: [
      {
        startDate: null,
        endDate: null,
      },
      {
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();
};