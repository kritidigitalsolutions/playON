const Comment = require("../../models/comment.model");

// GET COMMENTS
exports.getComments = async (
  req,
  res
) => {
  try {
    const { itemId } =
      req.params;

    const comments =
      await Comment.find({
        itemId,

        isDeleted: false
      })
        .populate(
          "userId",
          "fullName profilePic"
        )
        .sort({
          createdAt: -1
        });

    res.json({
      success: true,

      count:
        comments.length,

      comments
    });

  } catch (error) {
    res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};

// ADMIN DELETE COMMENT
exports.deleteComment = async (
  req,
  res
) => {
  try {
    const { commentId } =
      req.params;

    const comment =
      await Comment.findOne({
        _id: commentId,

        isDeleted: false
      });

    if (!comment) {
      return res.status(404).json({
        success: false,

        message:
          "Comment not found"
      });
    }

    // Admin can delete ANY comment
    comment.isDeleted = true;

    comment.deletedAt =
      new Date();

    await comment.save();

    res.json({
      success: true,

      message:
        "Comment deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};