const teamService = require("../services/team.service");

exports.getTeams = async (req, res) => {
  try {
    const teams = await teamService.getActiveTeams(req.query);

    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSingleTeam = async (req, res) => {
  try {
    const team = await teamService.getById(req.params.id);

    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    res.json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};