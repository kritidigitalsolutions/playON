const Comment = require("../models/comment.model");
const Match = require("../models/match.model");
const Series = require("../models/series.model");

exports.addComment = async (req, res) => {
  try {
    const { itemId, comment } = req.body;

    if (!itemId || !comment) {
      return res.status(400).json({
        success: false,
        message: "itemId and comment required"
      });
    }

    // 🔥 Detect type automatically
    let item = await Match.findById(itemId);

    if (!item) {
      item = await Series.findById(itemId);
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Invalid itemId (not match or series)"
      });
    }

    const newComment = await Comment.create({
      userId: req.user.userId,
      itemId,
      comment
    });

    const populated = await newComment.populate(
      "userId",
      "fullName profilePic"
    );

    res.status(201).json({
      success: true,
      message: "Comment added",
      comment: populated
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { itemId } = req.params;

    const comments = await Comment.find({ itemId })
      .populate("userId", "fullName profilePic")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: comments.length,
      comments
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};