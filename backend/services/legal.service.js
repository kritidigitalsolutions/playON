const LegalPage = require("../models/legal.model");

// Create or Update by type
exports.upsertPage = async (type, data, adminId) => {
  return await LegalPage.findOneAndUpdate(
    { type },
    {
      ...data,
      updatedBy: adminId
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );
};

// Get All Pages (Admin)
exports.getPages = async () => {
  return await LegalPage.find()
    .sort({ createdAt: 1 });
};

// Get Single by Type
exports.getPageByType = async (type) => {
  return await LegalPage.findOne({
    type,
    isActive: true
  });
};

// Get Single for Admin
exports.getAdminPageByType = async (type) => {
  return await LegalPage.findOne({ type });
};

// Toggle Status
exports.toggleStatus = async (type) => {
  const page = await LegalPage.findOne({ type });

  if (!page) return null;

  page.isActive = !page.isActive;
  await page.save();

  return page;
};

// Delete
exports.deletePage = async (type) => {
  return await LegalPage.findOneAndDelete({ type });
};