const ChannelCategory = require("../../models/channelCategory.model");
const Channel = require("../../models/channel.model");

const makeSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

// Create
exports.createCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    const category = await ChannelCategory.create({
      name,
      slug: makeSlug(name)
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get All
exports.getCategories = async (req, res) => {
  try {
    const categories = await ChannelCategory.find()
      .sort({ name: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update
exports.updateCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    const category =
      await ChannelCategory.findByIdAndUpdate(
        req.params.id,
        {
          name,
          slug: makeSlug(name)
        },
        { new: true, runValidators: true }
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      category
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete
exports.deleteCategory = async (req, res) => {
  try {
    const category =
      await ChannelCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    const used = await Channel.countDocuments({
      category: category.slug
    });

    if (used > 0) {
      return res.status(400).json({
        success: false,
        message: "Category is used by channels"
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};