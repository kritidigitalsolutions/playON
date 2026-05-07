const Comment = require("../models/comment.model");

const Match = require("../models/match.model");
const Series = require("../models/series.model");
const Podcast = require("../models/podcast.model");
const Highlight = require("../models/highlight.model");
const StarPlayer = require("../models/starPlayer.model");

// ADD COMMENT
exports.addComment = async (
  req,
  res
) => {
  try {
    const { itemId, comment } =
      req.body;

    if (!itemId || !comment) {
      return res.status(400).json({
        success: false,

        message:
          "itemId and comment required"
      });
    }

    // Auto detect model
    let item = null;

    item = await Match.findById(
      itemId
    );

    if (!item) {
      item =
        await Series.findById(
          itemId
        );
    }

    if (!item) {
      item =
        await Podcast.findById(
          itemId
        );
    }

    if (!item) {
      item =
        await Highlight.findById(
          itemId
        );
    }

    if (!item) {
      item =
        await StarPlayer.findById(
          itemId
        );
    }

    if (!item) {
      return res.status(404).json({
        success: false,

        message:
          "Invalid itemId"
      });
    }

    const newComment =
      await Comment.create({
        userId:
          req.user.userId,

        itemId,

        comment:
          comment.trim()
      });

    const populated =
      await newComment.populate(
        "userId",
        "fullName profilePic"
      );

    res.status(201).json({
      success: true,

      message:
        "Comment added",

      comment: populated
    });

  } catch (error) {
    res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};

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

// USER DELETE COMMENT
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

    // User can delete only own comment
    if (
      comment.userId.toString() !==
      req.user.userId
    ) {
      return res.status(403).json({
        success: false,

        message:
          "You can delete only your own comments"
      });
    }

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