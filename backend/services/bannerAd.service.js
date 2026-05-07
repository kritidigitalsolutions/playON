const BannerAd = require("../models/bannerAd.model");

// Single
exports.getBannerById = async (id) => {
  return await BannerAd.findById(id);
};


// Create
exports.createBanner = async (data) => {
  return await BannerAd.create(data);
};

// Admin List
exports.getBanners = async () => {
  return await BannerAd.find().sort({
    sortOrder: 1,
    createdAt: -1
  });
};

// Delete
exports.deleteBanner = async (id) => {
  return await BannerAd.findByIdAndDelete(id);
};

// Toggle Active
exports.toggleBanner = async (id) => {
  const banner = await BannerAd.findById(id);
  if (!banner) return null;

  banner.isActive = !banner.isActive;
  await banner.save();

  return banner;
};

// Public by Position
exports.getPublicBanners = async (position) => {
  const filter = { isActive: true };

  if (position) {
    filter.position = position;
  }

  return await BannerAd.find(filter).sort({
    sortOrder: 1,
    createdAt: -1
  });
};

// Click Count
exports.incrementClick = async (id) => {
  return await BannerAd.findByIdAndUpdate(
    id,
    { $inc: { clicks: 1 } },
    { new: true }
  );
};
// Update Banner
exports.updateBanner = async (id, data) => {
  return await BannerAd.findByIdAndUpdate(id, data, { new: true });
};
