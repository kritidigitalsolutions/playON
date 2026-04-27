const scoreService = require("../services/score.service");

exports.getLiveScores = async (req, res) => {
  try {
    const data = await scoreService.getLiveScores();

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getScoreByMatch = async (req, res) => {
  try {
    const data = await scoreService.getScoreByMatch(
      req.params.matchId
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getScoreboard = async (req, res) => {
  try {
    const data = await scoreService.getScoreboard(
      req.params.matchId
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Scoreboard not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPlayers = async (req, res) => {
  try {
    const data = await scoreService.getPlayers(
      req.params.matchId
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Players not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const data = await scoreService.getEvents(
      req.params.matchId
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Events not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTopPerformers = async (req, res) => {
  try {
    const data = await scoreService.getTopPerformers(
      req.params.matchId
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Top performers not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const data = await scoreService.getStats(
      req.params.matchId
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Stats not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getHighlights = async (req, res) => {
  try {
    const data = await scoreService.getHighlights(
      req.params.matchId
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Highlights not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};