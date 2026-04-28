const PromoCode = require("../../models/promoCode.model");


// CREATE PROMO
exports.createPromo = async (req, res) => {
  try {
    const promo = await PromoCode.create(req.body);

    res.status(201).json({
      success: true,
      message: "Promo created successfully",
      promo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// GET ALL PROMOS
exports.getPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find()
      .populate("applicablePlans", "title price planType")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: promos.length,
      promos
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// GET SINGLE PROMO
exports.getSinglePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id)
      .populate("applicablePlans", "title price planType");

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo not found"
      });
    }

    res.json({
      success: true,
      promo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// UPDATE PROMO
exports.updatePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo not found"
      });
    }

    res.json({
      success: true,
      message: "Promo updated successfully",
      promo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// DELETE PROMO
exports.deletePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo not found"
      });
    }

    res.json({
      success: true,
      message: "Promo deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// TOGGLE STATUS
exports.togglePromoStatus = async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id);

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo not found"
      });
    }

    promo.isActive = !promo.isActive;
    await promo.save();

    res.json({
      success: true,
      message: "Promo status updated",
      promo
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};